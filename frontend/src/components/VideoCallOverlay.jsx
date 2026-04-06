import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../pages/ChatDashboard';
import { useAuthStore } from '../store/authStore';
import { useCallStore } from '../store/callStore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Settings, UserPlus, X } from 'lucide-react';
import api from '../store/authStore';

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

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const outputs = devices.filter(d => d.kind === 'audiooutput');
      setAudioOutputs(outputs);
      if(outputs.length > 0) setSelectedOutput(outputs[0].deviceId);
    });

    const handleInitiateCall = async (e) => {
      const { userToCall, video } = e.detail;
      setIsVideo(video);
      setCamEnabled(video);
      setIsCalling(true);
      await getMedia(video);
      callUser(userToCall._id, userToCall.username, video);
    };

    window.addEventListener('initiate-call', handleInitiateCall);
    
    socket.on("call user", (data) => {
      setReceivingCall(true);
      setIsVideo(data.video);
      setCamEnabled(data.video);
      setCaller(data.from);
      setCallerName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("call ended", () => {
      // In a real multi-peer, we'd only remove the specific peer. For simplicity, any end call ends the session.
      cleanupSession();
    });

    socket.on("call accepted", async (data) => {
      setCallActive(true);
      const peerId = data.from;
      if(connectionRefs.current[peerId]) {
         await connectionRefs.current[peerId].setRemoteDescription(new RTCSessionDescription(data.signal));
      }
    });

    socket.on("ice candidate", async (data) => {
       const peerId = data.from;
       if(connectionRefs.current[peerId] && connectionRefs.current[peerId].remoteDescription) {
           await connectionRefs.current[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
       }
    });
    
    socket.on("missed call notification", (opts) => {
       alert(`Missed Call Details:\nYou missed a ${opts.type} call from ${opts.name}!`);
       // Optional: play a fast beep sound here manually if you wish
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
      
      // Auto-attach stream to ref if it exists
      setTimeout(() => {
         if (userVideos.current[idToCall]) {
            userVideos.current[idToCall].srcObject = event.streams[0];
         }
      }, 100);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice candidate", { to: idToCall, candidate: event.candidate, from: user._id });
      }
    };
    return peer;
  };

  const callUser = (idToCall, userName, videoEnabled) => {
    const peer = createPeer(idToCall, true);
    connectionRefs.current[idToCall] = peer;
    
    // Store preliminary info 
    setPeersUI(prev => ({ ...prev, [idToCall]: { name: userName } }));

    peer.createOffer()
      .then((offer) => peer.setLocalDescription(offer))
      .then(() => {
        socket.emit("call user", { userToCall: idToCall, signal: peer.localDescription, from: user._id, name: user.username, video: videoEnabled });
      });
  };

  const answerCall = async () => {
    setCallActive(true);
    await getMedia(isVideo);
    
    const peer = createPeer(caller, false);
    connectionRefs.current[caller] = peer;
    setPeersUI(prev => ({ ...prev, [caller]: { name: callerName } }));

    await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer call", { signal: peer.localDescription, to: caller, from: user._id });
  };
  
  const cleanupSession = () => {
     let wasActive = callActive;
     Object.values(connectionRefs.current).forEach(peer => peer.close());
     streamRef.current?.getTracks().forEach(t => t.stop());
     
     // Log the call for ALL outbound targets if we were the initiator
     if(isCalling) {
         Object.keys(connectionRefs.current).forEach(peerId => {
             logCall(peerId, isVideo ? 'video' : 'audio', wasActive ? 'completed' : 'missed');
             if (!wasActive) {
                // Outbound missed exactly - dispatch missed event dynamically!
                socket.emit("missed call notification", { to: peerId, name: user.username, type: isVideo ? 'Video' : 'Audio' });
             }
         });
     }
     
     // Reset
     setReceivingCall(false);
     setCallActive(false);
     setIsCalling(false);
     setCaller("");
     setCallerName("");
     setPeersUI({});
     connectionRefs.current = {};
     userVideos.current = {};
     setShowAddMember(false);
  };

  const endCall = () => {
    // End session for everyone connected
    Object.keys(connectionRefs.current).forEach(peerId => {
       socket.emit("end call", peerId);
    });
    // In case we were receiving but didn't accept yet
    if(receivingCall && !callActive) socket.emit("end call", caller);
    cleanupSession();
  };

  if (!receivingCall && !isCalling) return null;

  const activePeers = Object.entries(peersUI);

  return (
    <div className="fade-in" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', color: 'white'
    }}>
      {/* Top Header (Hardware Toggles) */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '15px' }}>
            {audioOutputs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                   <Settings size={16} /> Output:
                   <select value={selectedOutput} onChange={e => setSelectedOutput(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none' }}>
                      {audioOutputs.map(o => <option key={o.deviceId} value={o.deviceId} style={{ color: 'black' }}>{o.label || 'Speaker'}</option>)}
                   </select>
                </div>
            )}
         </div>
         {callActive && (
             <button className="btn" style={{ background: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAddMember(true)}>
                 <UserPlus size={18} /> Add Person
             </button>
         )}
      </div>

      {/* Main Grid Floor */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '20px', padding: '20px' }}>
         
         {/* My Video */}
         <div style={{ position: 'relative' }}>
             <video playsInline muted ref={myVideo} autoPlay style={{ width: '400px', height: '300px', borderRadius: '16px', border: '2px solid var(--primary-color)', transform: 'scaleX(-1)', objectFit: 'cover', display: isVideo && camEnabled ? 'block' : 'none' }} />
             {(!isVideo || !camEnabled) && (
                 <div style={{ width: '400px', height: '300px', borderRadius: '16px', border: '2px solid var(--primary-color)', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <h3 style={{ color: '#888' }}>You (Audio)</h3>
                 </div>
             )}
             <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px' }}>You</div>
         </div>
         
         {/* Remote Videos */}
         {callActive ? (
            activePeers.map(([peerId, peerData]) => (
                <div key={peerId} style={{ position: 'relative' }}>
                    <video playsInline ref={el => userVideos.current[peerId] = el} autoPlay style={{ width: '400px', height: '300px', borderRadius: '16px', border: '2px solid white', transform: 'scaleX(-1)', objectFit: 'cover', display: peerData.stream ? 'block' : 'none' }} />
                    {!peerData.stream && (
                        <div style={{ width: '400px', height: '300px', borderRadius: '16px', border: '2px dashed #666', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <h3>Connecting... {peerData.name}</h3>
                        </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '8px' }}>
                       {peerData.name}
                    </div>
                </div>
            ))
         ) : isCalling && !callActive ? (
            <div style={{ width: '400px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #666', borderRadius: '16px' }}>
                <h3>Ringing... {isVideo ? '(Video)' : '(Audio)'}</h3>
            </div>
         ) : null}
      </div>

      {/* Control Bar Bottom */}
      <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', gap: '30px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
        {receivingCall && !callActive && (
           <div style={{ textAlign: 'center', position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '24px' }}>
             <h2 style={{ marginBottom: '20px' }}>{callerName} is calling...</h2>
             <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                 <button onClick={answerCall} className="btn" style={{ background: '#4CAF50', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px' }}>
                     <Phone size={24} /> Answer
                 </button>
                 <button onClick={endCall} className="btn" style={{ background: '#F44336', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px' }}>
                     <PhoneOff size={24} /> Decline
                 </button>
             </div>
           </div>
        )}

        {(callActive || isCalling) && (
           <>
              <button className="btn" onClick={toggleMic} style={{ background: micEnabled ? 'rgba(255,255,255,0.2)' : '#F44336', borderRadius: '50%', width: '60px', height: '60px', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {micEnabled ? <Mic /> : <MicOff />}
              </button>
              {isVideo && (
                  <button className="btn" onClick={toggleCam} style={{ background: camEnabled ? 'rgba(255,255,255,0.2)' : '#F44336', borderRadius: '50%', width: '60px', height: '60px', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {camEnabled ? <Video /> : <VideoOff />}
                  </button>
              )}
              <button className="btn" onClick={endCall} style={{ background: '#F44336', borderRadius: '50%', width: '60px', height: '60px', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <PhoneOff />
              </button>
           </>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
         <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div className="card fade-in" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-color)', color: 'black' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Add to Call</h3>
                  <X style={{ cursor: 'pointer', color: 'gray' }} onClick={() => setShowAddMember(false)} />
               </div>
               <input className="input-field" placeholder="Search people..." value={search} onChange={(e) => handleSearch(e.target.value)} />
               <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map(u => (
                     <div key={u._id} onClick={() => { callUser(u._id, u.username, isVideo); setShowAddMember(false); }} style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                        <img src={u.profilePic} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                        <span>{u.username}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

export default VideoCallOverlay;
