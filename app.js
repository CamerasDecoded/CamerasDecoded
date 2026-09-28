const AppEngineState = {
matrix: { dark: null, normal: null, bright: null },
isLoaded: false,
currentPromptText: "A professional studio shot of an antique brass camera lens, highly detailed, sharp bokeh background",
isMotionMode: false,
motionDeltaOffset: 0,
animationFrameId: null,
playerProfile: { xp: 0, level: 1 }
};
const canvasElement = document.getElementById('viewfinderCanvas');
const canvasCtx = canvasElement.getContext('2d');
const loadingScreen = document.getElementById('loadingOverlay');
const statusText = document.getElementById('loadingStatusText');
const spinner = document.getElementById('spinner');
const authBtn = document.getElementById('authTriggerBtn');
const apertureSelector = document.getElementById('apertureSlider');
const shutterSelector = document.getElementById('shutterSlider');
const isoSelector = document.getElementById('isoSlider');
const operationalControls = [apertureSelector, shutterSelector, isoSelector];
operationalControls.forEach(control => control.addEventListener('input', () => {
document.getElementById('apertureVal').innerText = f/${apertureSelector.value};
document.getElementById('shutterVal').innerText = 1/${shutterSelector.value}s;
document.getElementById('isoVal').innerText = isoSelector.value;
executeViewfinderRenderLoop();
}));
function toggleMotionTrack() {
AppEngineState.isMotionMode = !AppEngineState.isMotionMode;
const btn = document.getElementById('motionModeBtn');
const indicator = document.getElementById('motionIndicator');
if (AppEngineState.isMotionMode) {
btn.innerText = "⚙ Mode: Kinetic Tracking";
btn.className = "text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold transition";
indicator.classList.remove('hidden');
initiateMotionDynamicsLoop();
} else {
btn.innerText = "⚙ Mode: Static";
btn.className = "text-[9px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold transition";
indicator.classList.add('hidden');
cancelAnimationFrame(AppEngineState.animationFrameId);
executeViewfinderRenderLoop();
}
}
function initiateMotionDynamicsLoop() {
if (!AppEngineState.isMotionMode) return;
AppEngineState.motionDeltaOffset = (AppEngineState.motionDeltaOffset + 2) % canvasElement.width;
executeViewfinderRenderLoop();
AppEngineState.animationFrameId = requestAnimationFrame(initiateMotionDynamicsLoop);
}
// 1. SECURE MANUAL USER INITIALIZATION PIXELS (Guarantees Connection passes Pop-up checkpoints)
function initiateSecurePuterHandshake() {
authBtn.classList.add('hidden');
spinner.classList.remove('hidden');
document.getElementById('loadingTitle').innerText = "Connecting to Cloud Server...";
// Firing this loop immediately directly off the click event bypasses the security constraints completely
compileAssetExposureMatrix(AppEngineState.currentPromptText);
}
async function compileAssetExposureMatrix(promptInputString) {
statusText.innerText = "Spawning high-fidelity multi-bracket matrices...";
AppEngineState.isLoaded = false;
document.getElementById('questObjective').innerText = promptInputString;
if (typeof puter === 'undefined') {
statusText.innerText = "Critical Script Error: Puter API SDK is blocked by browser configuration parameters.";
spinner.classList.add('hidden');
authBtn.classList.remove('hidden');
return;
}
try {
statusText.innerText = "Baking low lighting shadow layers [Bracket 1/3]...";
const darkImg = await puter.ai.txt2img(${promptInputString}, heavily underexposed, dark shadowy photo, low contrast moody profile look);
statusText.innerText = "Baking master dynamic dynamic profile [Bracket 2/3]...";
const midImg = await puter.ai.txt2img(${promptInputString}, clean balanced photographic exposure, masterpiece 8k resolution);
statusText.innerText = "Baking high highlight luminance clipping data [Bracket 3/3]...";
const flashImg = await puter.ai.txt2img(${promptInputString}, highly overexposed photograph, bright blinding sunlight glare, blown out highlights);
[darkImg, midImg, flashImg].forEach(img => img.crossOrigin = "anonymous");
AppEngineState.matrix.dark = darkImg;
AppEngineState.matrix.normal = midImg;
AppEngineState.matrix.bright = flashImg;
AppEngineState.isLoaded = true;
loadingScreen.classList.add('hidden');
executeViewfinderRenderLoop();
} catch (err) {
console.error("Cloud Handshake Interrupted:", err);
statusText.innerText = "Connection initialization paused. Verify account authorization popups are allowed, then click retry.";
spinner.classList.add('hidden');
authBtn.classList.remove('hidden');
authBtn.innerText = "Retry Secure Connection";
}
}
// 2. EXPOSURE BLENDING CORE RENDER PIPELINE
function executeViewfinderRenderLoop() {
if (!AppEngineState.isLoaded) return;
canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
const speedDenominator = parseInt(shutterSelector.value);
const apertureSquare = Math.pow(parseFloat(apertureSelector.value), 2);
const sensoryGain = parseInt(isoSelector.value);
const unifiedLuminosityIndex = (sensoryGain * 18) / (apertureSquare * speedDenominator);
const dynamicExposureClip = Math.min(1, Math.max(0, unifiedLuminosityIndex / 3.0));
let darkWeight = 0, balanceWeight = 0, highlightWeight = 0;
if (dynamicExposureClip <= 0.5) {
darkWeight = (0.5 - dynamicExposureClip) / 0.5;
balanceWeight = 1.0 - darkWeight;
} else {
highlightWeight = (dynamicExposureClip - 0.5) / 0.5;
balanceWeight = 1.0 - highlightWeight;
}
const horizontalScrollOffset = AppEngineState.isMotionMode ? AppEngineState.motionDeltaOffset : 0;
const drawLayerFrameWithOffset = (imgSource, calculatedOpacity) => {
if (!imgSource) return;
canvasCtx.globalAlpha = calculatedOpacity;
if (AppEngineState.isMotionMode) {
canvasCtx.drawImage(imgSource, -horizontalScrollOffset, 0, canvasElement.width, canvasElement.height);
canvasCtx.drawImage(imgSource, canvasElement.width - horizontalScrollOffset, 0, canvasElement.width, canvasElement.height);
} else {
canvasCtx.drawImage(imgSource, 0, 0, canvasElement.width, canvasElement.height);
}
};
if (AppEngineState.isMotionMode && speedDenominator < 500) {
const blurFactorPixels = Math.max(0, (500 - speedDenominator) / 38);
canvasCtx.filter = blur(${blurFactorPixels}px) contrast(110%);
} else if (parseFloat(apertureSelector.value) < 2.8) {
const blurFocusRadius = (2.8 - parseFloat(apertureSelector.value)) * 2.2;
canvasCtx.filter = blur(${blurFocusRadius}px);
} else {
canvasCtx.filter = 'none';
}
drawLayerFrameWithOffset(AppEngineState.matrix.dark, darkWeight);
drawLayerFrameWithOffset(AppEngineState.matrix.normal, balanceWeight);
drawLayerFrameWithOffset(AppEngineState.matrix.bright, highlightWeight);
canvasCtx.filter = 'none';
canvasCtx.globalAlpha = 1.0;
calculateUIMeteringTelemetry(dynamicExposureClip);
}
function calculateUIMeteringTelemetry(exposureValueFactor) {
const calculatedDeviationValue = (exposureValueFactor - 0.5) * 4;
['evMinus2','evMinus1','evCenter','evPlus1','evPlus2'].forEach(id => {
document.getElementById(id).className = "text-neutral-500 font-bold transition-all";
});
if (calculatedDeviationValue < -1.2) document.getElementById('evMinus2').className = "text-blue-500 font-black scale-110";
else if (calculatedDeviationValue >= -1.2 && calculatedDeviationValue < -0.3) document.getElementById('evMinus1').className = "text-blue-400 font-black scale-105";
else if (calculatedDeviationValue >= -0.3 && calculatedDeviationValue <= 0.3) document.getElementById('evCenter').className = "text-emerald-400 font-black scale-120";
else if (calculatedDeviationValue > 0.3 && calculatedDeviationValue <= 1.2) document.getElementById('evPlus1').className = "text-red-400 font-black scale-105";
else document.getElementById('evPlus2').className = "text-red-600 font-black scale-110";
}
function requestNewAiPlayground() {
const promptResponseString = prompt("Enter a customized target scenario to generate a live photography matrix sandbox playground:", AppEngineState.currentPromptText);
if (promptResponseString) {
AppEngineState.currentPromptText = promptResponseString;
loadingScreen.classList.remove('hidden');
authBtn.classList.add('hidden');
spinner.classList.remove('hidden');
document.getElementById('loadingTitle').innerText = "Regenerating Scene Matrix...";
compileAssetExposureMatrix(promptResponseString);
}
}
function processSystemShutterRelease() {
const currentSpeedRating = parseInt(shutterSelector.value);
const currentApertureRating = parseFloat(apertureSelector.value);
const currentISORating = parseInt(isoSelector.value);
const simulatedLightFactor = (currentISORating * 18) / (Math.pow(currentApertureRating, 2) * currentSpeedRating);
const verifiedExposureIndex = Math.min(1, Math.max(0, simulatedLightFactor / 3.0));
let reportVerdictText = "";
let generatedXpRewardPoints = 0;
if (AppEngineState.isMotionMode && currentSpeedRating < 500) {
reportVerdictText = "⚠️ MOTION BLUR FAILURE: Shutter open duration too long. Movement smeared sensor pixels.";
generatedXpRewardPoints = 20;
} else if (verifiedExposureIndex >= 0.42 && verifiedExposureIndex <= 0.58) {
reportVerdictText = "🎯 EXCELLENT MASTER EXPOSURE PROFILE! Dynamic range balance perfect.";
generatedXpRewardPoints = 200;
} else if (verifiedExposureIndex < 0.42) {
reportVerdictText = "🌑 UNDEREXPOSED CONFIGURATION: Sensor data starved of luminance.";
generatedXpRewardPoints = 35;
} else {
reportVerdictText = "💥 EXPOSURE OVERFLOW: Blinding highlight clip registers tripped.";
generatedXpRewardPoints = 25;
}
AppEngineState.playerProfile.xp += generatedXpRewardPoints;
document.getElementById('xpDisplay').innerText = ${AppEngineState.playerProfile.xp} XP;
alert(--- CAMERAS DECODED SESSION METRICS ---\n\n${reportVerdictText}\n\nSession Score Reward: +${generatedXpRewardPoints} XP secured.);
}
