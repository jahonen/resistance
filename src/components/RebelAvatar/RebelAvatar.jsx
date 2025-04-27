import React, { useMemo } from 'react';
import sha256 from 'crypto-js/sha256';
import './RebelAvatar.scss';

// --- Theme Colors (align with index.scss) ---
const TARGETING_YELLOW = '#FAF566';
const REBEL_ORANGE = '#FF7F00';
const X_WING_RED = '#D9381E';
const BACKGROUND_COLOR = '#1C2A3A'; // Or pure black '#000000'
const PLACEHOLDER_COLOR = '#666666';

// --- Targeting Computer Configuration ---
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const VANISHING_POINT_X = VIEWBOX_WIDTH / 2;
const VANISHING_POINT_Y = VIEWBOX_HEIGHT * 0.4; // Adjust vanishing point Y
const MAX_DEPTH_LEVELS = 6; // How many discrete depth lines
const MIN_DEPTH_LEVELS = 2;
const TRENCH_WIDTH_NEAR = VIEWBOX_WIDTH * 0.95;
const TRENCH_HEIGHT_NEAR = VIEWBOX_HEIGHT * 0.7;
const PERSPECTIVE_FACTOR = 0.1; // Adjust perspective intensity
const SIDE_BAR_WIDTH = 5;
const SIDE_BAR_Z = 0.5; // How 'far back' the side bars are
// ---------------------------------------

/**
 * Generates a unique targeting computer style avatar based on a passkey hash.
 *
 * @param {object} props - Component props.
 * @param {string} props.passkey - The 25-character passkey.
 * @param {number} [props.size=120] - The desired size of the avatar in pixels.
 * @returns {JSX.Element} SVG Targeting Computer avatar
 */
const RebelAvatar = ({ passkey, size = 120 }) => {
  // Generate hash from passkey
  const hash = useMemo(() => {
    if (!passkey || passkey.length !== 25) return null;
    return sha256(passkey).toString();
  }, [passkey]);

  // --- Perspective Projection ---
  const projectTo2D = (x3d, y3d, z3d) => {
    // Simple linear perspective projection
    const scaleFactor = 1 / (1 + z3d * PERSPECTIVE_FACTOR);
    const screenX = VANISHING_POINT_X + (x3d - VANISHING_POINT_X) * scaleFactor;
    // Project Y relative to center line to keep symmetry
    const screenY = VANISHING_POINT_Y + (y3d - VANISHING_POINT_Y) * scaleFactor;
    return { screenX, screenY, scaleFactor };
  };
  // ----------------------------

  // --- Calculate Grid & Elements from Hash ---
  const { gridLines, hashElements } = useMemo(() => {
    if (!hash) return { gridLines: [], hashElements: [] };

    const calculatedGridLines = [];
    const calculatedHashElements = [];

    // Determine number of depth levels from hash
    const numDepthLevels = MIN_DEPTH_LEVELS + (parseInt(hash.substring(0, 2), 16) % (MAX_DEPTH_LEVELS - MIN_DEPTH_LEVELS + 1));
    const depthStep = 1.5; // How much z increases per level

    // Calculate perspective grid lines at different depths
    for (let i = 0; i < numDepthLevels; i++) {
      const z = (i + 1) * depthStep;
      const hashOffset = 2 + i * 2;
      // Skip level based on hash?
      if (parseInt(hash.substring(hashOffset, hashOffset + 1), 16) % 3 === 0 && i > 0) continue;
      
      const nearWidth = TRENCH_WIDTH_NEAR;
      const nearHeight = TRENCH_HEIGHT_NEAR;
      const yFloorNear = VANISHING_POINT_Y + nearHeight / 2;
      const yCeilNear = VANISHING_POINT_Y - nearHeight / 2;
      const xLeftNear = VANISHING_POINT_X - nearWidth / 2;
      const xRightNear = VANISHING_POINT_X + nearWidth / 2;
      
      // Project the 4 corners at this depth
      const pTL = projectTo2D(xLeftNear, yCeilNear, z);
      const pTR = projectTo2D(xRightNear, yCeilNear, z);
      const pBL = projectTo2D(xLeftNear, yFloorNear, z);
      const pBR = projectTo2D(xRightNear, yFloorNear, z);

      // Add horizontal line (floor only)
      calculatedGridLines.push({ id: `h-${i}-b`, x1: pBL.screenX, y1: pBL.screenY, x2: pBR.screenX, y2: pBR.screenY });
      
      // Add vertical lines (walls)
      calculatedGridLines.push({ id: `v-${i}-l`, x1: pTL.screenX, y1: pTL.screenY, x2: pBL.screenX, y2: pBL.screenY });
      calculatedGridLines.push({ id: `v-${i}-r`, x1: pTR.screenX, y1: pTR.screenY, x2: pBR.screenX, y2: pBR.screenY });
    }
    
    // Determine Side Bars from Hash
    const showLeftBar = parseInt(hash.substring(15, 16), 16) % 2 === 0;
    const showRightBar = parseInt(hash.substring(16, 17), 16) % 2 === 0;
    const barColorRoll = parseInt(hash.substring(17, 18), 16) % 4; // 0: Red, 1: Orange, 2/3: None (or maybe yellow?)
    let barColor = null;
    if (barColorRoll === 0) barColor = X_WING_RED;
    else if (barColorRoll === 1) barColor = REBEL_ORANGE;
    // else barColor = TARGETING_YELLOW; // Option for yellow bars
    
    if (barColor) {
         const z = SIDE_BAR_Z;
         const nearWidth = TRENCH_WIDTH_NEAR; // Use near width for positioning
         const nearHeight = TRENCH_HEIGHT_NEAR;
         const yFloorNear = VANISHING_POINT_Y + nearHeight / 2;
         const yCeilNear = VANISHING_POINT_Y - nearHeight / 2;
         const xLeftNear = VANISHING_POINT_X - nearWidth / 2;
         const xRightNear = VANISHING_POINT_X + nearWidth / 2;

         // Project top/bottom points for the bars at depth Z
         const pL_ceil = projectTo2D(xLeftNear, yCeilNear, z);
         const pL_floor = projectTo2D(xLeftNear, yFloorNear, z);
         const pR_ceil = projectTo2D(xRightNear, yCeilNear, z);
         const pR_floor = projectTo2D(xRightNear, yFloorNear, z);
         
         const barWidthScale = pL_ceil.scaleFactor; // Scale width by perspective
         const barWidth = SIDE_BAR_WIDTH * barWidthScale;

         if (showLeftBar) {
             calculatedHashElements.push({ 
                 type: 'rect', 
                 id: 'bar-l', 
                 x: pL_ceil.screenX - barWidth / 2, // Center the bar on the projected line
                 y: pL_ceil.screenY, 
                 width: barWidth,
                 height: pL_floor.screenY - pL_ceil.screenY,
                 color: barColor
             });
         }
         if (showRightBar) {
             calculatedHashElements.push({ 
                 type: 'rect', 
                 id: 'bar-r', 
                 x: pR_ceil.screenX - barWidth / 2, // Center the bar on the projected line
                 y: pR_ceil.screenY, 
                 width: barWidth,
                 height: pR_floor.screenY - pR_ceil.screenY,
                 color: barColor
             });
         }
    }

    // --- Determine Central Arrows from Hash ---
    const arrowFlags = parseInt(hash.substring(18, 20), 16); // Use byte at index 18
    const showArrowUp = (arrowFlags & 0b0001) !== 0;
    const showArrowDown = (arrowFlags & 0b0010) !== 0;
    const showArrowLeft = (arrowFlags & 0b0100) !== 0;
    const showArrowRight = (arrowFlags & 0b1000) !== 0;
    const arrowColor = (arrowFlags & 0b10000) !== 0 ? REBEL_ORANGE : X_WING_RED;

    const arrowSize = 15; // Increased size (was 3)
    const arrowOffset = 5; // Distance from vanishing point

    // Define arrow paths (simple triangles pointing outwards)
    const arrowPathUp = `M ${VANISHING_POINT_X} ${VANISHING_POINT_Y - arrowOffset - arrowSize} l ${-arrowSize / 2} ${arrowSize} h ${arrowSize} z`;
    const arrowPathDown = `M ${VANISHING_POINT_X} ${VANISHING_POINT_Y + arrowOffset + arrowSize} l ${-arrowSize / 2} ${-arrowSize} h ${arrowSize} z`;
    const arrowPathLeft = `M ${VANISHING_POINT_X - arrowOffset - arrowSize} ${VANISHING_POINT_Y} l ${arrowSize} ${-arrowSize / 2} v ${arrowSize} z`;
    const arrowPathRight = `M ${VANISHING_POINT_X + arrowOffset + arrowSize} ${VANISHING_POINT_Y} l ${-arrowSize} ${-arrowSize / 2} v ${arrowSize} z`;

    if (showArrowUp) calculatedHashElements.push({ type: 'path', id: 'arrow-up', d: arrowPathUp, color: arrowColor });
    if (showArrowDown) calculatedHashElements.push({ type: 'path', id: 'arrow-down', d: arrowPathDown, color: arrowColor });
    if (showArrowLeft) calculatedHashElements.push({ type: 'path', id: 'arrow-left', d: arrowPathLeft, color: arrowColor });
    if (showArrowRight) calculatedHashElements.push({ type: 'path', id: 'arrow-right', d: arrowPathRight, color: arrowColor });

    return { gridLines: calculatedGridLines, hashElements: calculatedHashElements };
  }, [hash]);
  // -----------------------------------------

  // --- Render SVG ---
  const viewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

  // Define main converging lines (always drawn)
  const nearWidth = TRENCH_WIDTH_NEAR;
  const nearHeight = TRENCH_HEIGHT_NEAR;
  const yFloorNear = VANISHING_POINT_Y + nearHeight / 2;
  const yCeilNear = VANISHING_POINT_Y - nearHeight / 2;
  const xLeftNear = VANISHING_POINT_X - nearWidth / 2;
  const xRightNear = VANISHING_POINT_X + nearWidth / 2;

  // Project near corners (z=0)
  const pTL_near = projectTo2D(xLeftNear, yCeilNear, 0);
  const pTR_near = projectTo2D(xRightNear, yCeilNear, 0);
  const pBL_near = projectTo2D(xLeftNear, yFloorNear, 0);
  const pBR_near = projectTo2D(xRightNear, yFloorNear, 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="rebel-avatar targeting-avatar" // New specific class
      preserveAspectRatio="xMidYMid meet"
      style={{ backgroundColor: BACKGROUND_COLOR }}
    >
      {/* Main Converging Lines */}
      <line x1={pTL_near.screenX} y1={pTL_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={TARGETING_YELLOW} strokeWidth="0.7" />
      <line x1={pTR_near.screenX} y1={pTR_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={TARGETING_YELLOW} strokeWidth="0.7" />
      <line x1={pBL_near.screenX} y1={pBL_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={TARGETING_YELLOW} strokeWidth="0.7" />
      <line x1={pBR_near.screenX} y1={pBR_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={TARGETING_YELLOW} strokeWidth="0.7" />
      
      {/* Hash-determined Grid Lines */}
      {gridLines.map(line => (
        <line
          key={line.id}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={TARGETING_YELLOW}
          strokeWidth="0.4" // Thinner lines for depth grid
          opacity="0.7"
        />
      ))}
      
      {/* Hash-determined Elements (Side Bars, Reticle Highlights) */}
      {hashElements.map(el => {
        if (el.type === 'rect') {
          return (
            <rect
              key={el.id}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.color}
            />
          );
        } else if (el.type === 'path') {
          return (
            <path
              key={el.id}
              d={el.d}
              fill={el.color}
            />
          );
        }
        // Add other element types (e.g., path for reticle) later
        return null;
      })}

      {/* Static Central Reticle Base (Example) */}
      {/* Draw base yellow part - adjust path as needed */}
      <path d={`M ${VANISHING_POINT_X - 3},${VANISHING_POINT_Y} h6 M ${VANISHING_POINT_X},${VANISHING_POINT_Y - 3} v6`} 
            stroke={TARGETING_YELLOW} strokeWidth="0.8" fill="none" />

      {/* Placeholder / Invalid Passkey State */}
      {!hash && (
         <g className="placeholder-targeting">
            {/* Draw basic converging lines in placeholder color */}
            <line x1={pTL_near.screenX} y1={pTL_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={PLACEHOLDER_COLOR} strokeWidth="0.5" />
            <line x1={pTR_near.screenX} y1={pTR_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={PLACEHOLDER_COLOR} strokeWidth="0.5" />
            <line x1={pBL_near.screenX} y1={pBL_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={PLACEHOLDER_COLOR} strokeWidth="0.5" />
            <line x1={pBR_near.screenX} y1={pBR_near.screenY} x2={VANISHING_POINT_X} y2={VANISHING_POINT_Y} stroke={PLACEHOLDER_COLOR} strokeWidth="0.5" />
             <text x="50" y="70" textAnchor="middle" fill={PLACEHOLDER_COLOR} fontSize="10">INVALID PASSKEY</text>
         </g>
      )}
    </svg>
  );
};

export default RebelAvatar;