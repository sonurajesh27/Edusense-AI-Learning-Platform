import { Finger, FingerCurl, FingerDirection, GestureDescription } from 'fingerpose';

// ASL Letter A - Closed fist with thumb on side
export const aGesture = new GestureDescription('A');
aGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
aGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
aGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
aGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
aGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// ASL Letter B - Open hand, fingers together, thumb across palm
export const bGesture = new GestureDescription('B');
bGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
bGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
bGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
bGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
bGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// ASL Letter C - Curved hand forming C shape
export const cGesture = new GestureDescription('C');
cGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
cGesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
cGesture.addCurl(Finger.Ring, FingerCurl.HalfCurl, 1.0);
cGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 1.0);
cGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// ASL Letter D - Index finger up, others curled, thumb touching middle
export const dGesture = new GestureDescription('D');
dGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
dGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
dGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
dGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
dGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);

// ASL Letter E - Fingers curled down
export const eGesture = new GestureDescription('E');
eGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
eGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
eGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
eGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
eGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.9);

// ASL Letter F - OK sign (index and thumb form circle, others extended)
export const fGesture = new GestureDescription('F');
fGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
fGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
fGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
fGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.9);
fGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// ASL Letter G - Index finger and thumb parallel, pointing sideways
export const gGesture = new GestureDescription('G');
gGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
gGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
gGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
gGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
gGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
gGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.7);
gGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.7);

// ASL Letter H - Index and middle fingers extended sideways
export const hGesture = new GestureDescription('H');
hGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
hGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
hGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
hGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
hGesture.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.7);
hGesture.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.7);

// ASL Letter I - Pinky finger extended
export const iGesture = new GestureDescription('I');
iGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
iGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
iGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
iGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
iGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
iGesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 0.9);

// ASL Letter J - Pinky finger draws a J shape
export const jGesture = new GestureDescription('J');
jGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
jGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
jGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
jGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
jGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
jGesture.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 0.9);
jGesture.addDirection(Finger.Pinky, FingerDirection.HorizontalLeft, 0.7);
jGesture.addDirection(Finger.Pinky, FingerDirection.HorizontalRight, 0.7);

// ASL Letter K - Index up, middle out, thumb between
export const kGesture = new GestureDescription('K');
kGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
kGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
kGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
kGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
kGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// ASL Letter L - Thumb and index form L shape
export const lGesture = new GestureDescription('L');
lGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
lGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
lGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
lGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
lGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// ASL Letter M - Three fingers over thumb
export const mGesture = new GestureDescription('M');
mGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
mGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
mGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
mGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
mGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.8);

// ASL Letter N - Two fingers over thumb
export const nGesture = new GestureDescription('N');
nGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
nGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
nGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
nGesture.addCurl(Finger.Ring, FingerCurl.HalfCurl, 0.8);
nGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.8);

// ASL Letter O - All fingertips touching, forming O
export const oGesture = new GestureDescription('O');
oGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
oGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
oGesture.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
oGesture.addCurl(Finger.Ring, FingerCurl.HalfCurl, 1.0);
oGesture.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 1.0);

// ASL Letter P - K pointing down
export const pGesture = new GestureDescription('P');
pGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
pGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
pGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
pGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
pGesture.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.7);

// ASL Letter Q - G pointing down
export const qGesture = new GestureDescription('Q');
qGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
qGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
qGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
qGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
qGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
qGesture.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.7);

// ASL Letter R - Index and middle crossed
export const rGesture = new GestureDescription('R');
rGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
rGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
rGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
rGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
rGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);

// ASL Letter S - Closed fist with thumb in front
export const sGesture = new GestureDescription('S');
sGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
sGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
sGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
sGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
sGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// ASL Letter T - Fist with thumb between index and middle
export const tGesture = new GestureDescription('T');
tGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
tGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
tGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
tGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
tGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);

// ASL Letter U - Index and middle together pointing up
export const uGesture = new GestureDescription('U');
uGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
uGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
uGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
uGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
uGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
uGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);
uGesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.9);

// ASL Letter V - Index and middle fingers up (peace sign)
export const vGesture = new GestureDescription('V');
vGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
vGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
vGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
vGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
vGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);
vGesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.9);

// ASL Letter W - Three fingers up (index, middle, ring)
export const wGesture = new GestureDescription('W');
wGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
wGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
wGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
wGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
wGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.9);
wGesture.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.9);
wGesture.addDirection(Finger.Ring, FingerDirection.VerticalUp, 0.9);

// ASL Letter X - Index finger crooked/hooked
export const xGesture = new GestureDescription('X');
xGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
xGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
xGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
xGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
xGesture.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);

// ASL Letter Y - Thumb and pinky extended (shaka sign)
export const yGesture = new GestureDescription('Y');
yGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
yGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
yGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
yGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
yGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

// ASL Letter Z - Draw Z in the air (detected as pointing gesture)
export const zGesture = new GestureDescription('Z');
zGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
zGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
zGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
zGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
zGesture.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.9);

// Thumbs Up
export const thumbsUpGesture = new GestureDescription('👍');
thumbsUpGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Index, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
thumbsUpGesture.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);

// Open Hand (Hello / 5)
export const openHandGesture = new GestureDescription('👋');
openHandGesture.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
openHandGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
openHandGesture.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
openHandGesture.addCurl(Finger.Ring, FingerCurl.NoCurl, 1.0);
openHandGesture.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);

// Point (Index finger)
export const pointGesture = new GestureDescription('☝️');
pointGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
pointGesture.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
pointGesture.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
pointGesture.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
pointGesture.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);

// Export all gestures
export const allGestures = [
  aGesture,
  bGesture,
  cGesture,
  dGesture,
  eGesture,
  fGesture,
  gGesture,
  hGesture,
  iGesture,
  jGesture,
  kGesture,
  lGesture,
  mGesture,
  nGesture,
  oGesture,
  pGesture,
  qGesture,
  rGesture,
  sGesture,
  tGesture,
  uGesture,
  vGesture,
  wGesture,
  xGesture,
  yGesture,
  zGesture,
  thumbsUpGesture,
  openHandGesture,
  pointGesture
];

// Hand shape emojis for display
export const handShapes = {
  'A': '✊', 'B': '🖐️', 'C': '🤏', 'D': '☝️', 'E': '✊',
  'F': '👌', 'G': '👉', 'H': '👈', 'I': '🤙', 'J': '🤙',
  'K': '✌️', 'L': '🤟', 'M': '👊', 'N': '👊', 'O': '⭕',
  'P': '👇', 'Q': '👇', 'R': '🤞', 'S': '✊', 'T': '👊',
  'U': '🤘', 'V': '✌️', 'W': '🤟', 'X': '🤞', 'Y': '🤙', 'Z': '👉',
  '👍': '👍', '👋': '👋', '☝️': '☝️'
};

// Descriptions for each letter
export const aslDescriptions = {
  'A': 'Thumb beside closed fist',
  'B': 'Four fingers straight up',
  'C': 'Curved hand shape',
  'D': 'Index up, circle with others',
  'E': 'Fingertips bent down',
  'F': 'Index-thumb circle, three up',
  'G': 'Point sideways',
  'H': 'Two fingers sideways',
  'I': 'Pinky extended',
  'J': 'Draw J shape',
  'K': 'Index up, middle out',
  'L': 'Thumb-index L shape',
  'M': 'Three fingers over thumb',
  'N': 'Two fingers over thumb',
  'O': 'Fingertips form circle',
  'P': 'K pointing down',
  'Q': 'G pointing down',
  'R': 'Cross index-middle fingers',
  'S': 'Closed fist',
  'T': 'Fist with thumb between',
  'U': 'Two fingers together up',
  'V': 'Two fingers apart (Peace)',
  'W': 'Three fingers up',
  'X': 'Index crooked',
  'Y': 'Thumb-pinky extended',
  'Z': 'Draw Z motion',
  '👍': 'Thumbs up',
  '👋': 'Open hand wave',
  '☝️': 'Pointing up'
};
