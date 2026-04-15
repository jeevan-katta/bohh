import React, { useState, useMemo } from 'react';
import { Palette, Shuffle, ChevronLeft, ChevronRight, Sparkles, Grid3X3 } from 'lucide-react';

// ─── DiceBear 9.x Avatar Styles ───
const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Classic', emoji: '😊' },
  { id: 'adventurer', label: 'Adventure', emoji: '🧭' },
  { id: 'big-ears', label: 'Big Ears', emoji: '👂' },
  { id: 'bottts', label: 'Robot', emoji: '🤖' },
  { id: 'lorelei', label: 'Lorelei', emoji: '🌸' },
  { id: 'micah', label: 'Micah', emoji: '🎨' },
  { id: 'notionists', label: 'Notion', emoji: '✏️' },
  { id: 'pixel-art', label: 'Pixel', emoji: '👾' },
  { id: 'thumbs', label: 'Thumbs', emoji: '👍' },
  { id: 'fun-emoji', label: 'Emoji', emoji: '🤪' },
  { id: 'personas', label: 'Persona', emoji: '🧑' },
  { id: 'big-smile', label: 'Smile', emoji: '😄' },
];

// ─── Avataaars-specific features (v9 correct values) ───
const AVATAAARS_FEATURES = {
  top: {
    label: 'HAIR',
    emoji: '💇',
    values: [
      'bigHair','bob','bun','curly','curvy','dreads','dreads01','dreads02',
      'frida','frizzle','fro','froBand','hat','hijab',
      'longButNotTooLong','miaWallace','shaggy','shaggyMullet',
      'shavedSides','shortCurly','shortFlat','shortRound','shortWaved',
      'sides','straight01','straight02','straightAndStrand',
      'theCaesar','theCaesarAndSidePart','turban',
      'winterHat1','winterHat02','winterHat03','winterHat04'
    ]
  },
  eyes: {
    label: 'EYES',
    emoji: '👀',
    values: ['default','closed','cry','eyeRoll','happy','hearts','side','squint','surprised','wink','winkWacky','xDizzy']
  },
  eyebrows: {
    label: 'BROWS',
    emoji: '🤨',
    values: ['default','defaultNatural','angry','angryNatural','flatNatural','frownNatural','raisedExcited','raisedExcitedNatural','sadConcerned','sadConcernedNatural','unibrowNatural','upDown','upDownNatural']
  },
  mouth: {
    label: 'MOUTH',
    emoji: '👄',
    values: ['default','concerned','disbelief','eating','grimace','sad','screamOpen','serious','smile','tongue','twinkle','vomit']
  },
  clothing: {
    label: 'OUTFIT',
    emoji: '👕',
    values: ['blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','hoodie','overall','shirtCrewNeck','shirtScoopNeck','shirtVNeck']
  },
  facialHair: {
    label: 'BEARD',
    emoji: '🧔',
    values: ['','beardLight','beardMajestic','beardMedium','moustacheFancy','moustacheMagnum']
  },
  accessories: {
    label: 'GLASSES',
    emoji: '🕶️',
    values: ['','eyepatch','kurt','prescription01','prescription02','round','sunglasses','wayfarers']
  },
  clothingGraphic: {
    label: 'GRAPHIC',
    emoji: '🎨',
    values: ['','bat','bear','cumbia','deer','diamond','hola','pizza','resist','skull','skullOutline']
  }
};

const SKIN_COLORS = [
  { label: 'Light', value: 'ffdbb4' },
  { label: 'Peach', value: 'edb98a' },
  { label: 'Sun', value: 'fd9841' },
  { label: 'Amber', value: 'f8d25c' },
  { label: 'Tan', value: 'd08b5b' },
  { label: 'Brown', value: 'ae5d29' },
  { label: 'Dark', value: '614335' },
];

const HAIR_COLORS = [
  { label: 'Dark', value: '2c1b18' },
  { label: 'D. Brown', value: '4a312c' },
  { label: 'Brown', value: '724133' },
  { label: 'Auburn', value: 'a55728' },
  { label: 'Caramel', value: 'b58143' },
  { label: 'Blonde', value: 'd6b370' },
  { label: 'Platinum', value: 'ecdcbf' },
  { label: 'Silver', value: 'e8e1e1' },
  { label: 'Red', value: 'c93305' },
  { label: 'Strawberry', value: 'f59797' },
];

const CLOTHES_COLORS = [
  { label: 'Black', value: '262e33' },
  { label: 'Slate', value: '3c4f5c' },
  { label: 'Gray', value: '929598' },
  { label: 'White', value: 'e6e6e6' },
  { label: 'Blue', value: '65c9ff' },
  { label: 'D. Blue', value: '25557c' },
  { label: 'Indigo', value: '5199e4' },
  { label: 'Green', value: 'a7ffc4' },
  { label: 'Red', value: 'ff5c5c' },
  { label: 'Pink', value: 'ff488e' },
  { label: 'Rose', value: 'ffafb9' },
  { label: 'Cream', value: 'ffdeb5' },
  { label: 'Yellow', value: 'ffffb1' },
  { label: 'Pure', value: 'ffffff' },
];

function prettify(val) {
  if (!val) return 'None';
  return val
    .replace(/([A-Z0-9])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

function AvatarEditor({ config, onChange }) {
  const [activeTab, setActiveTab] = useState('top');
  const [colorFeature, setColorFeature] = useState('');
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'grid'

  const avatarUrl = useMemo(() => buildAvatarUrl(config), [config]);

  const handleNext = (featureKey) => {
    const values = AVATAAARS_FEATURES[featureKey].values;
    const currentIndex = values.indexOf(config[featureKey] || '');
    const nextIndex = (currentIndex + 1) % values.length;
    onChange({ ...config, [featureKey]: values[nextIndex] });
  };

  const handlePrev = (featureKey) => {
    const values = AVATAAARS_FEATURES[featureKey].values;
    const currentIndex = values.indexOf(config[featureKey] || '');
    const nextIndex = (currentIndex - 1 + values.length) % values.length;
    onChange({ ...config, [featureKey]: values[nextIndex] });
  };

  const selectFeatureValue = (featureKey, value) => {
    onChange({ ...config, [featureKey]: value });
  };

  const randomize = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    onChange({
      ...config,
      seed: Math.random().toString(36).substring(7),
      avatarStyle: config.avatarStyle || 'avataaars',
      top: pick(AVATAAARS_FEATURES.top.values),
      eyes: pick(AVATAAARS_FEATURES.eyes.values),
      eyebrows: pick(AVATAAARS_FEATURES.eyebrows.values),
      mouth: pick(AVATAAARS_FEATURES.mouth.values),
      clothing: pick(AVATAAARS_FEATURES.clothing.values),
      facialHair: pick(AVATAAARS_FEATURES.facialHair.values),
      accessories: pick(AVATAAARS_FEATURES.accessories.values),
      clothingGraphic: pick(AVATAAARS_FEATURES.clothingGraphic.values),
      skinColor: pick(SKIN_COLORS).value,
      hairColor: pick(HAIR_COLORS).value,
      clothesColor: pick(CLOTHES_COLORS).value,
    });
  };

  const switchStyle = (styleId) => {
    onChange({
      ...config,
      avatarStyle: styleId,
      seed: config.seed || Math.random().toString(36).substring(7),
    });
  };

  const currentStyle = config.avatarStyle || 'avataaars';
  const isAvataaars = currentStyle === 'avataaars';

  // Generate preview URLs for the grid view
  const getFeaturePreviewUrl = (featureKey, value) => {
    const previewConfig = { ...config, [featureKey]: value };
    return buildAvatarUrl(previewConfig);
  };

  return (
    <div className="avatar-editor">
      {/* Style Selector */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', 
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
          fontFamily: "'Outfit', sans-serif"
        }}>
          Avatar Style
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px'
        }}>
          {AVATAR_STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => switchStyle(s.id)}
              style={{
                background: currentStyle === s.id 
                  ? 'linear-gradient(135deg, var(--primary) 0%, #A855F7 100%)' 
                  : 'var(--bg-input)',
                color: currentStyle === s.id ? 'white' : 'var(--text-secondary)',
                border: '1px solid ' + (currentStyle === s.id ? 'rgba(124,58,237,0.3)' : 'var(--border-glass)'),
                borderRadius: 'var(--radius-md)',
                padding: '8px 4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.6875rem',
                fontWeight: 600,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Avatar Preview */}
      <div className="avatar-preview">
        <div className="avatar-preview-circle">
          <img src={avatarUrl} alt="Your avatar" />
        </div>
      </div>

      {/* Only show feature controls for avataaars */}
      {isAvataaars && (
        <>
          {/* Feature Tabs */}
          <div className="avatar-tabs">
            {Object.keys(AVATAAARS_FEATURES).map(key => (
              <button
                key={key}
                type="button"
                className={`avatar-tab${activeTab === key && !colorFeature ? ' active' : ''}`}
                onClick={() => { setActiveTab(key); setColorFeature(''); }}
                title={AVATAAARS_FEATURES[key].label}
              >
                {AVATAAARS_FEATURES[key].emoji}
              </button>
            ))}
            <button
              type="button"
              className={`avatar-tab${colorFeature ? ' active' : ''}`}
              onClick={() => setColorFeature('skinColor')}
              title="Colors"
            >
              <Palette size={14} />
            </button>
            {/* View mode toggle */}
            <button
              type="button"
              className="avatar-tab"
              onClick={() => setViewMode(v => v === 'carousel' ? 'grid' : 'carousel')}
              title={viewMode === 'carousel' ? 'Grid View' : 'Carousel View'}
              style={{ marginLeft: 'auto' }}
            >
              <Grid3X3 size={14} />
            </button>
          </div>

          {!colorFeature ? (
            viewMode === 'carousel' ? (
              /* Carousel Mode */
              <div className="avatar-option-selector">
                <button type="button" className="avatar-nav-btn" onClick={() => handlePrev(activeTab)}>
                  <ChevronLeft size={20} />
                </button>
                <div className="avatar-option-label">
                  <span className="avatar-option-category">{AVATAAARS_FEATURES[activeTab].emoji} {AVATAAARS_FEATURES[activeTab].label}</span>
                  <span className="avatar-option-value">{prettify(config[activeTab])}</span>
                </div>
                <button type="button" className="avatar-nav-btn" onClick={() => handleNext(activeTab)}>
                  <ChevronRight size={20} />
                </button>
              </div>
            ) : (
              /* Grid Mode — shows all options as small avatar previews */
              <div style={{
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-xl)',
                padding: '12px',
                border: '1px solid var(--border-glass)',
              }}>
                <div style={{ 
                  fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  {AVATAAARS_FEATURES[activeTab].emoji} {AVATAAARS_FEATURES[activeTab].label}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {AVATAAARS_FEATURES[activeTab].values.map(val => {
                    const isSelected = (config[activeTab] || '') === val;
                    return (
                      <button
                        key={val || 'none'}
                        type="button"
                        onClick={() => selectFeatureValue(activeTab, val)}
                        style={{
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.15))' 
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected 
                            ? '2px solid var(--primary)' 
                            : '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-md)',
                          padding: '6px 4px',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <img
                          src={getFeaturePreviewUrl(activeTab, val)}
                          alt={prettify(val)}
                          style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                          loading="lazy"
                        />
                        <span style={{ 
                          fontSize: '0.5rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: isSelected ? 700 : 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center'
                        }}>
                          {prettify(val)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="avatar-color-panel">
              <div className="avatar-color-tabs">
                <button type="button" className={`avatar-color-tab${colorFeature === 'skinColor' ? ' active' : ''}`} onClick={() => setColorFeature('skinColor')}>Skin</button>
                <button type="button" className={`avatar-color-tab${colorFeature === 'hairColor' ? ' active' : ''}`} onClick={() => setColorFeature('hairColor')}>Hair</button>
                <button type="button" className={`avatar-color-tab${colorFeature === 'clothesColor' ? ' active' : ''}`} onClick={() => setColorFeature('clothesColor')}>Outfit</button>
              </div>
              <div className="avatar-swatches">
                {(colorFeature === 'skinColor' ? SKIN_COLORS : colorFeature === 'hairColor' ? HAIR_COLORS : CLOTHES_COLORS).map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`avatar-swatch${config[colorFeature] === color.value ? ' selected' : ''}`}
                    style={{ backgroundColor: `#${color.value}` }}
                    onClick={() => onChange({ ...config, [colorFeature]: color.value })}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Non-avataaars styles: seed changer */}
      {!isAvataaars && (
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-xl)',
          padding: '16px',
          border: '1px solid var(--border-glass)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Click <strong>Randomize</strong> to generate a new look with the <strong>{AVATAR_STYLES.find(s => s.id === currentStyle)?.label}</strong> style!
          </p>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6].map(i => {
              const previewSeed = config.seed + '-' + i;
              const url = `https://api.dicebear.com/9.x/${currentStyle}/svg?seed=${encodeURIComponent(previewSeed)}&backgroundColor=transparent`;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange({ ...config, seed: previewSeed })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '2px solid transparent',
                    borderRadius: '50%',
                    padding: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '52px', height: '52px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <img src={url} alt={`Variant ${i}`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1, fontSize: '0.8125rem', padding: '10px' }}
          onClick={randomize}
        >
          <Shuffle size={16} /> Randomize
        </button>
        <button
          type="button"
          className="btn"
          style={{ 
            flex: 1, fontSize: '0.8125rem', padding: '10px',
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(124,58,237,0.15))',
            color: 'var(--accent)',
            border: '1px solid rgba(6,182,212,0.2)',
          }}
          onClick={() => {
            const styles = AVATAR_STYLES.map(s => s.id);
            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
            onChange({
              ...config,
              avatarStyle: randomStyle,
              seed: Math.random().toString(36).substring(7),
            });
          }}
        >
          <Sparkles size={16} /> Surprise Me
        </button>
      </div>
    </div>
  );
}

export function buildAvatarUrl(config) {
  if (!config) return `https://api.dicebear.com/9.x/bottts/svg?seed=default&backgroundColor=transparent`;
  
  const style = config.avatarStyle || 'avataaars';
  const seed = config.seed || 'default';
  
  // For non-avataaars styles, just use the seed
  if (style !== 'avataaars') {
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
  }
  
  // For avataaars, build exact params from config
  const params = new URLSearchParams();
  params.set('seed', seed);
  params.set('backgroundColor', 'transparent');
  
  if (config.top) params.set('top', config.top);
  if (config.eyes) params.set('eyes', config.eyes);
  if (config.eyebrows) params.set('eyebrows', config.eyebrows);
  if (config.mouth) params.set('mouth', config.mouth);
  if (config.clothing) params.set('clothing', config.clothing);
  
  if (config.facialHair) {
    params.set('facialHair', config.facialHair);
    params.set('facialHairProbability', '100');
  } else {
    params.set('facialHairProbability', '0');
  }
  
  if (config.accessories) {
    params.set('accessories', config.accessories);
    params.set('accessoriesProbability', '100');
  } else {
    params.set('accessoriesProbability', '0');
  }

  if (config.clothingGraphic) {
    params.set('clothingGraphic', config.clothingGraphic);
  }
  
  if (config.skinColor) params.set('skinColor', config.skinColor);
  if (config.hairColor) params.set('hairColor', config.hairColor);
  if (config.clothesColor) params.set('clothesColor', config.clothesColor);
  
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

export default AvatarEditor;
