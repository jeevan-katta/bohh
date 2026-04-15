import React, { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '../pages/ChatDashboard';
import { useAuthStore } from '../store/authStore';
import { useCallStore } from '../store/callStore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, UserPlus, X } from 'lucide-react';
import api from '../store/authStore';

function AudioVisualizerOverlay({ stream }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;
    
    let audioCtx;
    let analyser;
    let source;
    let reqId;
    
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser); // We don't connect to destination to avoid echo
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        let avg = sum / dataArray.length;
        setIsSpeaking(avg > 15);
        reqId = requestAnimationFrame(update);
      };
      
      update();
    } catch (e) {
      console.warn("Audio analysis failed", e);
    }
    
    return () => {
      if(reqId) cancelAnimationFrame(reqId);
      if(audioCtx && audioCtx.state !== 'closed') audioCtx.close();
    };
  }, [stream]);

  if (!isSpeaking) return null;
  return <div className="speaking-glow" />;
}

function VideoCallOverlay() {
  const user = useAuthStore(state => state.user);
  const logCall = useCallStore(state => state.logCall);
  
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isVideo, setIsVideo] = useState(true);
  const [localStreamObj, setLocalStreamObj] = useState(null);
  
  // Media states
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState('');
  
  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Multi-peer maps
  const [peersUI, setPeersUI] = useState({}); // { [userId]: { name, stream } }
  
  const connectionRefs = useRef({}); // { [userId]: RTCPeerConnection }
  const myVideo = useRef(null);
  const streamRef = useRef(null);
  const userVideos = useRef({}); // { [userId]: HTMLVideoElement }
  
  // Use refs to avoid stale closures in socket listeners
  const callActiveRef = useRef(false);
  const isCallingRef = useRef(false);
  const isVideoRef = useRef(true);
  const receivingCallRef = useRef(false);
  const callerRef = useRef("");
  const pendingCandidates = useRef({}); // { [userId]: RTCIceCandidate[] }

  // Sync state → refs
  useEffect(() => { callActiveRef.current = callActive; }, [callActive]);
  useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
  useEffect(() => { isVideoRef.current = isVideo; }, [isVideo]);
  useEffect(() => { receivingCallRef.current = receivingCall; }, [receivingCall]);
  useEffect(() => { callerRef.current = caller; }, [caller]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      setAudioOutputs(outputs);
      // Default to empty string (system default) to avoid routing to silent virtual cables
    });

    const handleInitiateCall = async (e) => {
      const { userToCall, video } = e.detail;
      setIsVideo(video);
      isVideoRef.current = video;
      setCamEnabled(video);
      setIsCalling(true);
      isCallingRef.current = true;
      await getMedia(video);
      callUser(userToCall._id, userToCall.username, video);
    };

    window.addEventListener('initiate-call', handleInitiateCall);
    
    socket.on("call user", (data) => {
      setReceivingCall(true);
      receivingCallRef.current = true;
      setIsVideo(data.video);
      isVideoRef.current = data.video;
      setCamEnabled(data.video);
      setCaller(data.from);
      callerRef.current = data.from;
      setCallerName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("call ended", () => {
      // In a real multi-peer, we'd only remove the specific peer. For simplicity, any end call ends the session.
      cleanupSession();
    });

    socket.on("call accepted", async (data) => {
      setCallActive(true);
      callActiveRef.current = true;
      const peerId = data.from;
      if(connectionRefs.current[peerId]) {
         await connectionRefs.current[peerId].setRemoteDescription(new RTCSessionDescription(data.signal));
         // Flush pending candidates
         if (pendingCandidates.current[peerId]) {
             for (const candidate of pendingCandidates.current[peerId]) {
                 await connectionRefs.current[peerId].addIceCandidate(new RTCIceCandidate(candidate));
             }
             delete pendingCandidates.current[peerId];
         }
      }
    });

    socket.on("ice candidate", async (data) => {
       const peerId = data.from;
       const peer = connectionRefs.current[peerId];
       if (peer && peer.remoteDescription) {
           await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
       } else {
           // Queue them up if peer isn't ready
           if (!pendingCandidates.current[peerId]) pendingCandidates.current[peerId] = [];
           pendingCandidates.current[peerId].push(data.candidate);
       }
    });
    
    socket.on("missed call notification", (opts) => {
       alert(`Missed Call Details:\nYou missed a ${opts.type} call from ${opts.name}!`);
    });

    return () => {
      window.removeEventListener('initiate-call', handleInitiateCall);
      socket.off("call user");
      socket.off("call ended");
      socket.off("call accepted");
      socket.off("ice candidate");
      socket.off("missed call notification");
    };
  }, []);
  
  // Apply sink ID strictly when refs update
  useEffect(() => {
    if (!selectedOutput) return;
    Object.values(userVideos.current).forEach(videoEl => {
      if (videoEl && typeof videoEl.setSinkId === 'function') {
        videoEl.setSinkId(selectedOutput).catch(e => console.log('Sink API error', e));
      }
    });
  }, [selectedOutput, peersUI]);

  const getMedia = async (videoEnabled) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: true });
      streamRef.current = stream;
      setLocalStreamObj(stream);
      if (myVideo.current) myVideo.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Failed to get media", err);
    }
  };

  const toggleMic = () => {
     if(streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if(audioTrack) {
           audioTrack.enabled = !audioTrack.enabled;
           setMicEnabled(audioTrack.enabled);
        }
     }
  };
  
  const toggleCam = () => {
     if(streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if(videoTrack) {
           videoTrack.enabled = !videoTrack.enabled;
           setCamEnabled(videoTrack.enabled);
        }
     }
  };

  const handleSearch = async (term) => {
    setSearch(term);
    if (!term) return setSearchResults([]);
    try {
      const { data } = await api.get(`/users?search=${term}`);
      setSearchResults(data);
    } catch (error) {}
  };

  const createPeer = (idToCall, isInitiator) => {
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    streamRef.current?.getTracks().forEach((track) => peer.addTrack(track, streamRef.current));

    peer.ontrack = (event) => {
      // Add stream to peersUI to trigger render
      setPeersUI(prev => {
         const exists = prev[idToCall];
         return {
            ...prev,
            [idToCall]: { ...exists, stream: event.streams[0] }
         };
      });
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        const currentUser = useAuthStore.getState().user;
        socket.emit("ice candidate", { to: idToCall, candidate: event.candidate, from: currentUser._id });
      }
    };
    return peer;
  };

  const callUser = (idToCall, userName, videoEnabled) => {
    const peer = createPeer(idToCall, true);
    connectionRefs.current[idToCall] = peer;
    
    // Store preliminary info 
    setPeersUI(prev => ({ ...prev, [idToCall]: { name: userName } }));

    const currentUser = useAuthStore.getState().user;

    peer.createOffer()
      .then((offer) => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit("call user", { userToCall: idToCall, signal: peer.localDescription, from: currentUser._id, name: currentUser.username, video: videoEnabled });
      });
  };

  const answerCall = async () => {
    setCallActive(true);
    callActiveRef.current = true;
    await getMedia(isVideo);
    
    const peer = createPeer(caller, false);
    connectionRefs.current[caller] = peer;
    setPeersUI(prev => ({ ...prev, [caller]: { name: callerName } }));

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    // Flush pending candidates for the caller
    if (pendingCandidates.current[caller]) {
        for (const candidate of pendingCandidates.current[caller]) {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
        delete pendingCandidates.current[caller];
    }

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const currentUser = useAuthStore.getState().user;
    socket.emit("answer call", { signal: peer.localDescription, to: caller, from: currentUser._id });
  };
  
  const cleanupSession = (isLocalHangup = false) => {
     // Read from refs to get CURRENT values (not stale closure values)
     let wasActive = callActiveRef.current;
     let wasCalling = isCallingRef.current;
     let wasVideo = isVideoRef.current;
     
     Object.values(connectionRefs.current).forEach(peer => peer.close());
     streamRef.current?.getTracks().forEach(t => t.stop());
     // Ensure ref is nulled so next getMedia is clean
     streamRef.current = null;
     setLocalStreamObj(null);
     
     // Log the call for ALL outbound targets if we were the initiator
     if(wasCalling) {
         const currentUser = useAuthStore.getState().user;
         Object.keys(connectionRefs.current).forEach(peerId => {
             logCall(peerId, wasVideo ? 'video' : 'audio', wasActive ? 'completed' : 'missed');
             
             // ONLY emit missed notification if *we* hung up before it was active.
             // If they declined, they already know they missed it.
             if (!wasActive && isLocalHangup) {
                socket.emit("missed call notification", { to: peerId, name: currentUser?.username || 'Someone', type: wasVideo ? 'Video' : 'Audio' });
             }
         });
     }
     
     // Reset
     setReceivingCall(false);
     receivingCallRef.current = false;
     setCallActive(false);
     callActiveRef.current = false;
     setIsCalling(false);
     isCallingRef.current = false;
     setCaller("");
     callerRef.current = "";
     setCallerName("");
     setPeersUI({});
     connectionRefs.current = {};
     pendingCandidates.current = {};
     userVideos.current = {};
     setShowAddMember(false);
  };

  const endCall = () => {
    // End session for everyone connected
    Object.keys(connectionRefs.current).forEach(peerId => {
       socket.emit("end call", peerId);
    });
    // In case we were receiving but didn't accept yet
    if(receivingCallRef.current && !callActiveRef.current) socket.emit("end call", callerRef.current);
    cleanupSession(true);
  };

  if (!receivingCall && !isCalling) return null;

  const activePeers = Object.entries(peersUI);
  const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

  return (
    <div className="call-overlay fade-in">
      {/* Top Header (Hardware Toggles) */}
      <div className="call-header">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {audioOutputs.length > 0 && (
            <div className="output-selector">
              <Settings size={14} />
              <span>Output:</span>
              <select value={selectedOutput} onChange={e => setSelectedOutput(e.target.value)}>
                {audioOutputs.map(o => (
                  <option key={o.deviceId} value={o.deviceId}>{o.label || 'Speaker'}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {callActive && (
          <button className="btn btn-primary" onClick={() => setShowAddMember(true)} style={{ minWidth: 'auto', padding: '8px 16px' }}>
            <UserPlus size={16} /> Add Person
          </button>
        )}
      </div>

      {/* Main Grid Floor */}
      <div className="call-grid">
        {/* My Video */}
        <div className="call-tile self">
          <AudioVisualizerOverlay stream={localStreamObj} />
          {isVideo && camEnabled ? (
            <video playsInline muted ref={myVideo} autoPlay />
          ) : (
            <div className="placeholder">
              <div className="avatar-circle">{getInitial(user?.username)}</div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You {!isVideo ? '(Audio)' : '(Camera Off)'}</span>
            </div>
          )}
          <div className="tile-label">You</div>
        </div>
        
        {/* Remote Videos */}
        {callActive ? (
          activePeers.map(([peerId, peerData]) => (
            <div key={peerId} className="call-tile">
              <AudioVisualizerOverlay stream={peerData.stream} />
              {peerData.stream ? (
                <video 
                   playsInline 
                   autoPlay 
                   ref={el => {
                      if (el) {
                         userVideos.current[peerId] = el;
                         if (el.srcObject !== peerData.stream) {
                            el.srcObject = peerData.stream;
                         }
                      }
                   }} 
                />
              ) : (
                <div className="placeholder">
                  <div className="avatar-circle">{getInitial(peerData.name)}</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Connecting... {peerData.name}</span>
                </div>
              )}
              <div className="tile-label">{peerData.name}</div>
            </div>
          ))
        ) : isCalling && !callActive ? (
          <div className="call-tile">
            <div className="placeholder">
              <div className="ringing-state">
                <div className="avatar-circle" style={{ animation: 'ring-pulse 2s infinite' }}>
                  <Phone size={32} />
                </div>
                <h3>Ringing... {isVideo ? '(Video)' : '(Audio)'}</h3>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Control Bar Bottom */}
      <div className="call-controls">
        {receivingCall && !callActive && (
          <div className="incoming-call-dialog">
            <div className="caller-avatar">
              <Phone size={36} color="var(--primary)" />
            </div>
            <h2>{callerName}</h2>
            <p>Incoming {isVideo ? 'video' : 'audio'} call...</p>
            <div className="call-actions">
              <button onClick={answerCall} className="btn btn-primary" style={{ padding: '14px 28px' }}>
                <Phone size={20} /> Answer
              </button>
              <button onClick={endCall} className="btn btn-danger" style={{ padding: '14px 28px' }}>
                <PhoneOff size={20} /> Decline
              </button>
            </div>
          </div>
        )}

        {(callActive || isCalling) && (
          <>
            <button className={`btn-icon glass${!micEnabled ? ' active' : ''}`} onClick={toggleMic} title={micEnabled ? 'Mute' : 'Unmute'}>
              {micEnabled ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
            {isVideo && (
              <button className={`btn-icon glass${!camEnabled ? ' active' : ''}`} onClick={toggleCam} title={camEnabled ? 'Turn off camera' : 'Turn on camera'}>
                {camEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            )}
            <button className="btn-icon glass active" onClick={endCall} title="End Call">
              <PhoneOff size={22} />
            </button>
          </>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddMember(false)} style={{ zIndex: 10 }}>
          <div className="modal-content card fade-in-scale">
            <div className="modal-header">
              <h2>Add to Call</h2>
              <button className="btn-ghost" onClick={() => setShowAddMember(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input className="input-field" placeholder="Search people..." value={search} onChange={(e) => handleSearch(e.target.value)} />
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map(u => (
                  <div 
                    key={u._id} 
                    className="search-result-item"
                    onClick={() => { callUser(u._id, u.username, isVideo); setShowAddMember(false); }}
                  >
                    <img src={u.profilePic} alt="" />
                    <span>{u.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCallOverlay;
