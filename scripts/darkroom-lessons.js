// ================================================================
// DARKROOM LESSONS & DRILLS — inline learning content
// Rendered inside the Darkroom skill sheet (no page changes).
// window.DARKROOM_LESSONS = { [skillId]: { lesson: {cards[], check{}}, drill: [] } }
// ================================================================
window.DARKROOM_LESSONS = {

/* ---------------- CAMERA BASICS ---------------- */
'camera-basics': {
  lesson: { cards: [
    { h: 'Your camera is three tools', p: 'Body, lens, and dials. The body captures, the lens shapes, the dials decide. Every photo you will ever take is those three agreeing with each other.' },
    { h: 'Sharp first, art second', p: 'Half-press the shutter to lock focus, then press fully to shoot. If the subject is not sharp, nothing else about the photo matters — nail this before chasing style.' },
    { h: 'Hold it like it matters', p: 'Left hand cradles the lens from below, elbows tucked into your ribs, breathe out as you shoot. Most "blurry camera" problems are holding problems.' }
  ], check: { q: 'What is the correct shutter technique?',
    options: ['Jab the button as fast as possible', 'Half-press to focus, then press fully', 'Hold the button down and hope', 'Press fully in one quick stab'],
    answer: 1, why: 'Half-press locks focus and exposure; the full press then takes a sharp, deliberate shot.' } },
  drill: [
    { q: 'Your photos keep coming out soft. What do you fix first?',
      options: ['Buy a sharper lens', 'Your grip and stance', 'A more expensive body', 'Shoot only in daylight'],
      answer: 1, why: 'Technique first. Most softness is camera shake from poor holding, not gear.' },
    { q: 'Where does your left hand go?',
      options: ['On top of the camera', 'Cradling the lens from below', 'In your pocket', 'On the shutter button'],
      answer: 1, why: 'The left hand carries the lens weight from underneath — stable and ready to focus.' },
    { q: 'What does a half-press of the shutter do?',
      options: ['Takes the photo', 'Locks focus and exposure', 'Turns the camera off', 'Opens the aperture'],
      answer: 1, why: 'Half-press meters and focuses; the camera is then committed before you fire.' },
    { q: 'Elbows should be…',
      options: ['Flared out wide', 'Tucked into your ribs', 'Resting on your hips', 'It does not matter'],
      answer: 1, why: 'Tucked elbows turn your torso into a tripod. Flared elbows turn it into a sail.' }
  ] },

/* ---------------- EXPOSURE TRIANGLE ---------------- */
'exposure-triangle': {
  lesson: { cards: [
    { h: 'Three dials, one photo', p: 'Aperture, shutter speed, and ISO trade with each other. Open one, you must close another — the triangle is a negotiation, never a free lunch.' },
    { h: 'Aperture = depth', p: 'f/1.8 lets in lots of light and blurs the background. f/11 lets in little light and keeps everything sharp. Wide open for subjects, stopped down for scenes.' },
    { h: 'Shutter = time, ISO = gain', p: '1/1000s freezes motion; 1/30s blurs it. ISO 100 is clean; ISO 6400 is grainy. When light runs out, you spend shutter first, ISO second.' }
  ], check: { q: 'You open the aperture from f/8 to f/4 (2 stops brighter). To keep the same exposure you must…',
    options: ['Raise ISO 2 stops', 'Use a 2-stops-faster shutter speed', 'Change nothing', 'Open the aperture more'],
    answer: 1, why: 'Two stops brighter in one corner demands two stops darker in another. Faster shutter is the cleanest trade.' } },
  drill: [
    { q: 'You want a blurry background AND a sharp runner. Which corner do you push?',
      options: ['Wide aperture + fast shutter + higher ISO', 'Small aperture + slow shutter', 'Low ISO only', 'Manual focus'],
      answer: 0, why: 'Wide aperture blurs the background; fast shutter freezes the runner; ISO covers the light bill.' },
    { q: 'The meter says you are 1 stop underexposed. Fastest fix?',
      options: ['Halve the shutter speed', 'Double the ISO', 'Either — both add exactly 1 stop', 'Open the aperture 2 stops'],
      answer: 2, why: 'Each is a 1-stop brightening. Knowing they are interchangeable IS the triangle.' },
    { q: 'f/2.8 → f/5.6 is how many stops darker?',
      options: ['1 stop', '2 stops', '3 stops', 'Half a stop'],
      answer: 1, why: 'f/2.8 → f/4 → f/5.6: two full stops. The f-stop scale doubles each stop.' },
    { q: 'Night street scene, no tripod. Your first move?',
      options: ['Drop to 1/10s handheld', 'Open the aperture wide', 'Stay at ISO 100', 'Use the flash'],
      answer: 1, why: 'Aperture costs nothing in sharpness. Spend it before shutter (shake) or ISO (grain).' }
  ] },

/* ---------------- METERING ---------------- */
'metering': {
  lesson: { cards: [
    { h: 'The meter wants gray', p: 'Your camera meters the world as if everything were middle gray. Snow becomes gray, black cats become gray. The meter is honest — and wrong about everything.' },
    { h: 'Three ways to listen', p: 'Evaluative reads the whole frame. Center-weighted trusts the middle. Spot reads one tiny point. Bright or dark subject? Spot or center-weighted beats evaluative.' },
    { h: 'Tell it what correct looks like', p: 'Point the meter at what matters, lock exposure (half-press or AE-L), then recompose. You are the editor; the meter is just an intern.' }
  ], check: { q: 'A white wedding dress fills the frame and the meter says "correct." The photo will be…',
    options: ['Perfectly white', 'Gray and underexposed', 'Blown out', 'Too warm'],
    answer: 1, why: 'The meter drags white down to middle gray. You must add exposure compensation for bright subjects.' } },
  drill: [
    { q: 'Backlit portrait, face in shadow. Best metering?',
      options: ['Evaluative', 'Spot on the face', 'Spot on the bright background', 'It does not matter'],
      answer: 1, why: 'Meter the face — the thing that matters — not the sky behind it.' },
    { q: 'What does AE-L do?',
      options: ['Locks focus', 'Locks the exposure reading', 'Turns off the meter', 'Deletes the photo'],
      answer: 1, why: 'Auto-Exposure Lock freezes the meter reading so you can recompose freely.' },
    { q: 'Snowy landscape on evaluative metering looks…',
      options: ['Too bright', 'Gray and dull', 'Perfect', 'Too blue'],
      answer: 1, why: 'The meter underexposes snow toward middle gray. Add +1 to +2 stops of compensation.' },
    { q: 'Stage performer under a spotlight, dark hall. Use…',
      options: ['Evaluative — trust the camera', 'Spot on the performer', 'Center-weighted on the crowd', 'Manual ISO 100'],
      answer: 1, why: 'Evaluative averages the dark hall and blows out the performer. Spot reads only the subject.' }
  ] },

/* ---------------- FOCUS ---------------- */
'focus': {
  lesson: { cards: [
    { h: 'One shot vs. tracking', p: 'Single AF locks once — for still subjects. Continuous AF tracks — for anything moving. Wrong mode is the #1 cause of "my camera can\'t focus." It can. You told it the wrong job.' },
    { h: 'Put the point on the eye', p: 'Move the focus point; do not focus-and-recompose at wide apertures. The nearest eye to camera gets the point. Everything else is negotiable.' },
    { h: 'When AF gives up, go manual', p: 'Low light, low contrast, macro — autofocus hunts. Flip to manual, magnify the view, and nail it yourself. Pros do this constantly.' }
  ], check: { q: 'A toddler runs toward you. Correct AF setup?',
    options: ['Single AF, center point', 'Continuous AF + burst', 'Manual focus, f/16', 'Face detect off, single shot'],
    answer: 1, why: 'Continuous AF tracks the approach; burst gives you the frames to choose from.' } },
  drill: [
    { q: 'Portrait at f/1.4, you focus-and-recompose. Result?',
      options: ['Tack sharp', 'Focus lands behind the eye', 'Brighter exposure', 'Nothing changes'],
      answer: 1, why: 'Recomposing swings the thin focal plane off the eye. Move the AF point instead.' },
    { q: 'AF hunts in a dark club and never locks. You…',
      options: ['Keep half-pressing harder', 'Switch to manual focus', 'Raise the flash', 'Give up'],
      answer: 1, why: 'No contrast, no AF. Manual focus with magnification is the pro move in the dark.' },
    { q: 'Bird in flight, blue sky. Best choice?',
      options: ['Single AF on a branch', 'Continuous AF, wide area', 'Manual focus at infinity', 'Spot metering'],
      answer: 1, why: 'Continuous AF with a wide area stays glued to erratic motion against clean sky.' },
    { q: 'Eye-AF exists to…',
      options: ['Make the eyes brighter', 'Lock focus on the nearest eye automatically', 'Remove red-eye', 'Blur the background'],
      answer: 1, why: 'Eye-AF finds and tracks eyes so you can compose while it holds focus.' }
  ] },

/* ---------------- APERTURE ---------------- */
'aperture': {
  lesson: { cards: [
    { h: 'f/1.8 vs. f/11', p: 'Small number, big hole, lots of light, thin slice of focus. Big number, small hole, little light, deep focus. The numbers run backwards from intuition — learn them cold.' },
    { h: 'Bokeh is a decision', p: 'f/1.8–f/2.8 melts backgrounds into cream. That isolation is why portraits sing at wide apertures — the subject has nowhere to hide and nothing to compete with.' },
    { h: 'Sharpness has a sweet spot', p: 'Most lenses are sharpest 2–3 stops down from wide open — often f/5.6 to f/8. Landscapes live here: deep focus, peak sharpness, tripod optional in good light.' }
  ], check: { q: 'Group photo, two rows of people, 35mm lens. Aperture?',
    options: ['f/1.4', 'f/8', 'f/2', 'Wide open'],
    answer: 1, why: 'Two rows need depth. f/8 keeps every face sharp; f/1.4 would blur the back row.' } },
  drill: [
    { q: 'You want ONLY the eyes sharp, everything else creamy. Use…',
      options: ['f/11', 'f/1.8', 'f/8', 'f/16'],
      answer: 1, why: 'Wide open gives the thinnest depth of field — eyes sharp, world melted.' },
    { q: 'Landscape, foreground flowers to distant mountains. Use…',
      options: ['f/2', 'f/11', 'f/1.4', 'f/2.8'],
      answer: 1, why: 'Stopped down buys the deep focus a landscape needs, near to far.' },
    { q: 'At f/16 in bright light, sharpness can actually drop because of…',
      options: ['Diffraction', 'Too much bokeh', 'Sensor heat', 'Lens flare'],
      answer: 0, why: 'Tiny apertures diffract light and soften the image. f/8–f/11 is usually the limit.' },
    { q: 'Aperture priority mode lets you control…',
      options: ['Shutter speed directly', 'Aperture; camera picks shutter', 'ISO only', 'Focus points'],
      answer: 1, why: 'You set the f-stop (the look); the camera meters the shutter (the math).' }
  ] },

/* ---------------- SHUTTER ---------------- */
'shutter': {
  lesson: { cards: [
    { h: 'Time, sliced', p: '1/1000s freezes a sprint. 1/60s shows a blur. Shutter speed is how long the camera stares — short stares freeze, long stares smear.' },
    { h: 'The handshake rule', p: 'Handheld, keep shutter at or faster than 1/focal length: 50mm needs 1/60s or faster. Slower than that without support is a blurry lottery ticket.' },
    { h: 'Blur on purpose', p: 'Slow the shutter and pan with a cyclist, or let a waterfall turn to silk. Motion blur is a feature the moment you choose it.' }
  ], check: { q: 'Shooting handheld at 200mm with no stabilization. Minimum safe shutter?',
    options: ['1/60s', '1/200s', '1/30s', '1/1000s always'],
    answer: 1, why: '1/focal length: 200mm wants 1/200s or faster to beat handshake.' } },
  drill: [
    { q: 'You want crisp stadium action under lights. Start at…',
      options: ['1/60s', '1/1000s', '1/4s', '30 seconds'],
      answer: 1, why: 'Freezing athletes needs 1/1000s or faster. Everything slower smears.' },
    { q: 'Waterfall as silky blur. You need…',
      options: ['Fast shutter', 'Slow shutter + support', 'High ISO', 'Wide aperture'],
      answer: 1, why: 'Slow shutter (1/4s+) smears the water; support keeps the rocks sharp.' },
    { q: 'Photo is sharp but too dark at 1/500s f/4. Brighten WITHOUT touching aperture?',
      options: ['Slow to 1/250s', 'Speed to 1/1000s', 'Close to f/8', 'Nothing possible'],
      answer: 0, why: '1/500 → 1/250 is one stop brighter. Shutter is yours to spend.' },
    { q: 'Panning a race car at 1/30s gives…',
      options: ['A frozen car, sharp background', 'A sharp car against streaked background', 'Total blur', 'A darker photo'],
      answer: 1, why: 'Tracking the car keeps it sharp while the world streaks past — speed you can feel.' }
  ] },

/* ---------------- ISO ---------------- */
'iso': {
  lesson: { cards: [
    { h: 'Gain, not light', p: 'ISO does not gather light — it amplifies the signal. ISO 6400 is the camera shouting to hear a whisper. Shouting adds noise.' },
    { h: 'The clean order', p: 'When light runs out: open the aperture first (free), slow the shutter second (costs motion), raise ISO last (costs cleanliness). ISO is the final dial, not the first.' },
    { h: 'Grain is a texture', p: 'Modern cameras shoot clean to ISO 3200–6400. And a little grain beats a blurry photo every time — noise is honest, motion blur is a mistake.' }
  ], check: { q: 'Indoor event, f/2.8, 1/125s, ISO 1600 — still dark. Best next move?',
    options: ['Drop to 1/30s', 'Raise to ISO 3200', 'Close to f/8', 'Use flash only'],
    answer: 1, why: 'Aperture is maxed, shutter is at the motion limit — ISO is the correct final dial.' } },
  drill: [
    { q: 'Base ISO on most cameras is…',
      options: ['ISO 100', 'ISO 800', 'ISO 6400', 'ISO 50 always'],
      answer: 0, why: 'ISO 100 is the cleanest signal — the reference everything else is amplified from.' },
    { q: 'Doubling ISO from 400 to 800 does what?',
      options: ['Adds 2 stops', 'Adds 1 stop of brightness + more noise', 'Nothing', 'Halves the file size'],
      answer: 1, why: 'Each ISO doubling is exactly one stop — brighter, grainier.' },
    { q: 'Night street, handheld, 35mm. Aperture f/2, shutter 1/60s, still dark. You…',
      options: ['Raise ISO', 'Slow to 1/8s', 'Close aperture', 'Go home'],
      answer: 0, why: 'Shutter is at the handshake limit — ISO is the only honest dial left.' },
    { q: 'Auto ISO is useful because…',
      options: ['It replaces the aperture', 'It floats the last variable while you control look and motion', 'It removes noise', 'It is always ISO 100'],
      answer: 1, why: 'You lock aperture and shutter (the creative choices); ISO handles the math.' }
  ] },

/* ---------------- EXPOSURE COMPENSATION ---------------- */
'exp-comp': {
  lesson: { cards: [
    { h: 'Override the intern', p: 'Exposure compensation (+/− EV) tells the meter "brighter" or "darker than you think." It is the fastest override on the camera — one dial, no menus.' },
    { h: 'White needs plus', p: 'Snow, white dresses, bright sand: the meter grays them out. Dial +1 to +2 EV and the white stays white.' },
    { h: 'Black needs minus', p: 'Black cats, night scenes, dark stages: the meter brightens them to gray mush. Dial −1 EV and the dark stays dark.' }
  ], check: { q: 'Beach sand at noon looks gray and muddy. Fix?',
    options: ['−1 EV', '+1 to +2 EV', 'Change white balance', 'Switch to manual focus'],
    answer: 1, why: 'Bright scene fooled the meter — add positive compensation to restore the whites.' } },
  drill: [
    { q: 'Spotlit musician on a black stage, face blown out. Fix?',
      options: ['+1 EV', '−1 EV', 'Raise ISO', 'Wider aperture'],
      answer: 1, why: 'Dark scene fooled the meter into overexposing — pull it back with negative comp.' },
    { q: '+1 EV means…',
      options: ['One stop brighter', 'One stop darker', 'ISO 100', 'f/1.0'],
      answer: 0, why: 'Positive EV brightens the metered exposure by exactly that many stops.' },
    { q: 'In aperture priority, +1 EV changes the…',
      options: ['Aperture', 'Shutter speed (camera re-meters)', 'ISO only', 'Focal length'],
      answer: 1, why: 'Aperture is locked by you, so the camera shifts the shutter to honor the compensation.' },
    { q: 'Foggy morning looks too dark and contrasty. Fix?',
      options: ['−2 EV', '+1 EV', 'Spot meter the fog', 'Underexpose'],
      answer: 1, why: 'Fog is bright — the meter underexposes it. Positive comp restores the luminous gray.' }
  ] },

/* ---------------- MANUAL MODE ---------------- */
'manual-mode': {
  lesson: { cards: [
    { h: 'You are the meter now', p: 'Manual mode: you set aperture, shutter, AND ISO. The camera meters but never overrides. Total control — and total responsibility.' },
    { h: 'Walk the meter to zero', p: 'Dial settings until the meter needle centers. Then decide: do you AGREE with zero? Snow at zero is gray — you already know to push past it.' },
    { h: 'Change one thing at a time', p: 'Set aperture for the look, shutter for the motion, ISO for the light — in that order. Manual is just the triangle with the training wheels off.' }
  ], check: { q: 'Manual mode, meter centered, photo looks right. Light drops 1 stop. You…',
    options: ['Switch to auto', 'Open aperture, slow shutter, or raise ISO by 1 stop', 'Do nothing', 'Add flash'],
    answer: 1, why: 'The meter will show −1; you rebalance the triangle yourself. That is the whole job.' } },
  drill: [
    { q: 'Biggest advantage of manual in a studio with strobes?',
      options: ['Faster shooting', 'Exposure never shifts between frames', 'Better colors', 'Longer battery'],
      answer: 1, why: 'Constant light + manual = every frame identical. Auto would hunt and vary.' },
    { q: 'In manual, the meter needle sits at +2. That means…',
      options: ['2 stops over what the meter calls correct', 'ISO 200', 'f/2', 'The battery is full'],
      answer: 0, why: 'The needle reports your settings against the meter — +2 is two stops bright.' },
    { q: 'Panorama across a sunset: manual or auto?',
      options: ['Auto — faster', 'Manual — locked exposure stitches cleanly', 'Does not matter', 'Aperture priority'],
      answer: 1, why: 'Auto re-meters every frame and the pano bands. Manual holds one exposure across all frames.' },
    { q: 'You set everything manually but the photo is dark. First check?',
      options: ['The lens cap', 'Where the meter needle sits', 'The white balance', 'The file format'],
      answer: 1, why: 'The needle tells you exactly how far off you are — then move one dial.' }
  ] },

/* ---------------- RULE OF THIRDS ---------------- */
'thirds': {
  lesson: { cards: [
    { h: 'The grid in your head', p: 'Divide the frame into thirds, both ways. The four intersections are where eyes land first — put your subject on one, not in the middle.' },
    { h: 'Center is a statement', p: 'Centered compositions feel formal, still, confrontational. Use center on purpose — symmetry, confrontation, icon — never by accident.' },
    { h: 'Give motion room', p: 'A subject moving right needs space on the right. Crowd the direction of motion and the photo feels trapped; open it and the photo breathes.' }
  ], check: { q: 'A runner sprints left-to-right across your frame. Best placement?',
    options: ['Dead center', 'Left third, space opening to the right', 'Right third, cramped at the edge', 'Top center'],
    answer: 1, why: 'Lead room: space ahead of the motion. The eye follows the run into the frame.' } },
  drill: [
    { q: 'Horizon line in a landscape usually sits…',
      options: ['Dead center', 'On the upper or lower third', 'Diagonal', 'It does not matter'],
      answer: 1, why: 'Thirds give the sky or land clear dominance — center horizons split the photo indecisively.' },
    { q: 'Portrait, subject looking frame-left. Place the face…',
      options: ['Left third', 'Right third, looking into the space', 'Center', 'Bottom corner'],
      answer: 1, why: 'Nose room: the gaze needs space to travel into. Face right, space left.' },
    { q: 'Two subjects of equal weight. Thirds suggests…',
      options: ['Both centered', 'One per side, balanced on thirds', 'Crop one out', 'Stack vertically'],
      answer: 1, why: 'Opposing thirds create tension and balance without a dead center.' },
    { q: 'Breaking thirds works when…',
      options: ['Never', 'It is deliberate — symmetry, isolation, confrontation', 'You forget the grid', 'Shooting fast'],
      answer: 1, why: 'Rules are tools. Break them loudly and on purpose, not by accident.' }
  ] },

/* ---------------- LEADING LINES ---------------- */
'leading-lines': {
  lesson: { cards: [
    { h: 'Roads for the eye', p: 'Roads, rails, fences, shorelines, shadows — lines drag the viewer through the frame. Find the line first, then place the subject where it ends.' },
    { h: 'Get low, get long', p: 'Lines converge harder from low angles. Crouch down and foreground lines stretch toward the subject like arrows.' },
    { h: 'Curves slow, straights rush', p: 'A straight road hurries the eye to the subject. A winding path makes the viewer linger. Choose the speed of the journey.' }
  ], check: { q: 'A pier stretches into the sea toward a lighthouse. Strongest composition?',
    options: ['Shoot the lighthouse alone', 'Low angle, pier leading to the lighthouse', 'Top-down of the planks', 'Pier cropped out'],
    answer: 1, why: 'The pier is a perfect leading line — low and long, it delivers the eye to the lighthouse.' } },
  drill: [
    { q: 'Where should the subject sit relative to the lines?',
      options: ['Where the lines converge or exit', 'Behind the camera', 'On top of the lines', 'Anywhere'],
      answer: 0, why: 'Lines are delivery routes — the payoff waits at the destination.' },
    { q: 'Strongest leading lines are usually…',
      options: ['Faint and subtle', 'Entering from the frame edges', 'In the exact center', 'Blurred out'],
      answer: 1, why: 'Lines that enter from the edges pull the outside eye inward.' },
    { q: 'A shadow across the pavement can be…',
      options: ['A distraction to avoid', 'A leading line', 'An exposure error', 'Nothing'],
      answer: 1, why: 'Any line counts — light draws them for free every golden hour.' },
    { q: 'Two competing line sets in one frame. You…',
      options: ['Keep both — more is more', 'Simplify to the strongest one', 'Blur everything', 'Shoot wider'],
      answer: 1, why: 'Lines compete for the eye. One clear path beats two arguments.' }
  ] },

/* ---------------- FRAMING & LAYERS ---------------- */
'framing': {
  lesson: { cards: [
    { h: 'Shoot through something', p: 'Doorways, windows, branches, arches — a frame inside your frame adds depth instantly and hides messy edges.' },
    { h: 'Three layers deep', p: 'Foreground, middle, background. A photo with all three feels like a place you could walk into. One layer is a postcard; three is a world.' },
    { h: 'Foreground is the secret', p: 'Most flat photos are missing a foreground. Step back, crouch down, put something near the lens — depth appears like magic.' }
  ], check: { q: 'A mountain vista looks flat and distant. Fastest fix?',
    options: ['Zoom in tighter', 'Add a foreground element — rocks, branches, a fence', 'Raise the ISO', 'Shoot at noon'],
    answer: 1, why: 'Foreground creates the near-far scale that turns a vista into depth.' } },
  drill: [
    { q: 'Shooting through a doorway, the foreground goes dark. Fix?',
      options: ['Expose for the subject, let the frame silhouette', 'Expose for the doorway', 'Use flash', 'Delete it'],
      answer: 0, why: 'The frame is meant to go dark — it becomes a vignette that spotlights the subject.' },
    { q: 'Layers work best when…',
      options: ['All three are tack sharp', 'Each layer is distinct — near, middle, far', 'Everything is blurred', 'Only the background matters'],
      answer: 1, why: 'Separation between layers is what reads as depth.' },
    { q: 'A branch intrudes at the frame edge. You…',
      options: ['Clone it out later', 'Use it as a deliberate frame or move to exclude it', 'Ignore it', 'Widen the aperture'],
      answer: 1, why: 'Half-in branches are accidents. Commit: frame through it or clear it.' },
    { q: 'Best aperture for keeping all three layers sharp?',
      options: ['f/1.8', 'f/8–f/11', 'f/2.8', 'Wide open'],
      answer: 1, why: 'Depth needs depth of field — stop down so near and far both resolve.' }
  ] },

/* ---------------- SEEING LIGHT ---------------- */
'seeing-light': {
  lesson: { cards: [
    { h: 'Photography is light-catching', p: 'Before subject, before settings — see the light. Where is it coming from? How hard is it? What color? Every great photo starts as a lighting observation.' },
    { h: 'Hard vs. soft', p: 'Hard light (noon sun, bare bulb): sharp shadows, drama. Soft light (overcast, window): gentle transitions, flattery. Neither is better — they are different instruments.' },
    { h: 'Direction is everything', p: 'Front light flattens. Side light sculpts. Back light glows. Move yourself — or wait — until the light does the work for you.' }
  ], check: { q: 'You want dramatic texture on an old wall. Best light?',
    options: ['Noon sun straight on', 'Low side light raking across it', 'Overcast flat light', 'Flash on camera'],
    answer: 1, why: 'Side light rakes across texture and carves every bump into shadow. Flat light erases it.' } },
  drill: [
    { q: 'Golden hour is prized because the light is…',
      options: ['Brightest', 'Low, warm, and directional', 'Easiest to meter', 'Always overcast'],
      answer: 1, why: 'Low angle sculpts, warm color flatters — an hour of free cinema lighting.' },
    { q: 'Harsh noon portraits look bad mainly due to…',
      options: ['Too much light overall', 'Hard downward shadows — raccoon eyes', 'Wrong white balance', 'Slow shutter'],
      answer: 1, why: 'Overhead hard light carves deep eye shadows. Find shade or wait.' },
    { q: 'Open shade on a sunny day gives…',
      options: ['Hard dramatic light', 'Soft, flattering, even light', 'No light at all', 'Color casts only'],
      answer: 1, why: 'Shade blocks the hard sun; the bright sky becomes a giant softbox.' },
    { q: 'Backlit hair glowing at sunset is…',
      options: ['A mistake', 'Rim light — separation from the background', 'Lens flare', 'Overexposure'],
      answer: 1, why: 'Backlight rims the subject in glow — expose for the face and let it shine.' }
  ] },

/* ---------------- NEGATIVE SPACE ---------------- */
'neg-space': {
  lesson: { cards: [
    { h: 'Less subject, more story', p: 'Negative space is the empty area around your subject — sky, wall, fog, water. It makes a small subject feel monumental and lonely and loud.' },
    { h: 'Emptiness must be clean', p: 'One bird in an empty sky: powerful. One bird in a sky with a plane, a wire, and clutter: ruined. The space must be truly empty.' },
    { h: 'Small subject, big feeling', p: 'Shrink the subject to a fifth of the frame or less. The void does the emotional work — isolation, calm, scale, awe.' }
  ], check: { q: 'A lone tree in fog. Strongest treatment?',
    options: ['Fill the frame with the tree', 'Tiny tree, vast fog around it', 'Add three more trees', 'Crop the fog out'],
    answer: 1, why: 'The fog IS the photo. A small tree inside it feels infinite.' } },
  drill: [
    { q: 'Negative space fails when…',
      options: ['The subject is small', 'The "empty" area has distracting elements', 'The light is soft', 'It is black and white'],
      answer: 1, why: 'Clutter in the void kills the effect — the space must read as intentional emptiness.' },
    { q: 'Best skies for negative space?',
      options: ['Busy dramatic clouds', 'Clean gradient or solid overcast', 'Airplanes', 'It never matters'],
      answer: 1, why: 'Clean skies are ready-made negative space. Busy skies compete.' },
    { q: 'Subject placement with big negative space?',
      options: ['Dead center always', 'Off-center, breathing into the space', 'Touching the edge', 'Split in half'],
      answer: 1, why: 'Off-center lets the emptiness have direction — the subject looks or moves into it.' },
    { q: 'Negative space in a portrait feels…',
      options: ['Like a mistake', 'Intimate or isolated, depending on the gaze', 'Too bright', 'Unprofessional'],
      answer: 1, why: 'Space around a face amplifies mood — the viewer feels the distance.' }
  ] },

/* ---------------- WHITE BALANCE ---------------- */
'white-balance': {
  lesson: { cards: [
    { h: 'White should be white', p: 'Different lights have different colors — tungsten is orange, shade is blue. White balance tells the camera what "neutral" looks like so whites stay white.' },
    { h: 'Presets beat auto, sometimes', p: 'Auto WB is decent, but it neutralizes mood — it will kill a golden sunset trying to "fix" it. Lock the preset to keep the feeling.' },
    { h: 'Wrong on purpose', p: 'Set Tungsten in daylight and the world goes blue — instant moonlight. White balance is a creative dial once you stop treating it as a correction.' }
  ], check: { q: 'Indoor tungsten party and you want to keep the warm mood. You…',
    options: ['Leave Auto — it is always right', 'Lock a warm preset so the camera stops "correcting" it', 'Convert to black and white', 'Use flash'],
    answer: 1, why: 'Auto neutralizes the warmth you actually want. Lock it and keep the mood.' } },
  drill: [
    { q: 'Shade on a sunny day photographs…',
      options: ['Neutral', 'Blue/cool', 'Orange', 'Green'],
      answer: 1, why: 'Shade is lit by blue sky, not the sun. The Shade preset warms it back.' },
    { q: 'Shooting RAW makes white balance…',
      options: ['Irrelevant — fully adjustable later', 'Locked forever', 'Automatic', 'Unnecessary'],
      answer: 0, why: 'RAW stores the sensor data; WB is just metadata you can change losslessly.' },
    { q: 'Sunset looks washed out on Auto WB. Fix in camera?',
      options: ['Raise ISO', 'Set a locked Daylight/Shade preset', 'Underexpose 3 stops', 'Use flash'],
      answer: 1, why: 'Auto WB fights the golden color. A locked preset lets the sunset be a sunset.' },
    { q: 'Mixed office fluorescents + window daylight gives…',
      options: ['Perfect color', 'Conflicting color casts — pick your poison or shoot RAW', 'No light', 'Better contrast'],
      answer: 1, why: 'Two color temperatures cannot both be neutral. Choose the subject\'s light or fix in RAW.' }
  ] },

/* ---------------- COLOR TEMPERATURE ---------------- */
'color-temp': {
  lesson: { cards: [
    { h: 'Kelvin is a mood dial', p: '3200K is candle-orange. 5600K is noon-neutral. 7500K+ is shade-blue. Lower numbers = warmer, higher = cooler. Backwards from intuition, unforgettable once learned.' },
    { h: 'Warm advances, cool recedes', p: 'Warm tones feel close and energetic; cool tones feel distant and calm. Color temperature is depth and emotion, not just accuracy.' },
    { h: 'Golden vs. blue hour', p: 'Golden hour (~3500K): warm, nostalgic, romantic. Blue hour (~7500K): cool, electric, cinematic. Same street, two movies — pick your genre.' }
  ], check: { q: 'You want a lonely, cinematic night street. Dial…',
    options: ['3200K', '7500K+', 'Auto and hope', '5600K'],
    answer: 1, why: 'High Kelvin leans into the blue — distance, night, cinema.' } },
  drill: [
    { q: 'Candlelit dinner at 3200K, camera set to 3200K gives…',
      options: ['Blue faces', 'Neutral, accurate color', 'Green faces', 'No photo'],
      answer: 1, why: 'Matching the light\'s temperature neutralizes it. That is what the Kelvin setting does.' },
    { q: 'Same candles, camera left at 5600K. Result?',
      options: ['Neutral', 'Warm orange glow preserved', 'Blue', 'Black'],
      answer: 1, why: '5600K expects daylight, so the warm candles render warm. Mood kept.' },
    { q: 'Overcast day at 6500K looks…',
      options: ['Orange', 'Neutral to slightly cool', 'Purple', 'Blown out'],
      answer: 1, why: 'Overcast light IS cool — matching Kelvin renders it honestly.' },
    { q: 'Fastest way to warm up a cold scene in camera?',
      options: ['Raise ISO', 'Dial Kelvin down', 'Dial Kelvin up', 'Open aperture'],
      answer: 1, why: 'Lower Kelvin = warmer render. 4500K on a 6500K scene adds golden warmth.' }
  ] },

/* ---------------- COLOR HARMONY ---------------- */
'color-harmony': {
  lesson: { cards: [
    { h: 'Colors have relationships', p: 'Complementary colors (orange/blue, red/green) vibrate against each other. Analogous colors (blue/teal/green) melt together. Both are powerful — choose the feeling.' },
    { h: 'One color is a statement', p: 'A single bold color in a neutral scene stops the scroll. Find the red door, the yellow taxi, the green bottle — then simplify everything around it.' },
    { h: 'Teal and orange is not an accident', p: 'Cinema\'s favorite grade works because skin is orange and shadows go teal — complementary contrast that flatters people and deepens scenes.' }
  ], check: { q: 'A blue boat on orange sand at sunset. Why does it pop?',
    options: ['It is brighter', 'Blue and orange are complementary — maximum contrast', 'The boat is big', 'Sunsets are sharp'],
    answer: 1, why: 'Complementary colors vibrate. The color wheel did the composing for you.' } },
  drill: [
    { q: 'Red subject, green background. The palette is…',
      options: ['Analogous', 'Complementary', 'Monochrome', 'Broken'],
      answer: 1, why: 'Opposites on the wheel — red/green is classic complementary tension.' },
    { q: 'A frame of only blues and teals feels…',
      options: ['Chaotic', 'Calm and unified', 'Underexposed', 'Oversaturated'],
      answer: 1, why: 'Analogous colors sit together on the wheel — harmony without conflict.' },
    { q: 'To make a yellow subject sing, place it against…',
      options: ['More yellow', 'Purple/blue tones', 'White seamless', 'Black velvet'],
      answer: 1, why: 'Yellow\'s complement is purple-blue. Opposition makes it electric.' },
    { q: 'Desaturating everything except one color is…',
      options: ['A mistake', 'Selective color — powerful when the color earns it', 'Only for weddings', 'Impossible in camera'],
      answer: 1, why: 'One surviving color becomes the entire subject. Use sparingly.' }
  ] },

/* ---------------- GOLDEN HOUR ---------------- */
'golden-hour': {
  lesson: { cards: [
    { h: 'The hour that flatters everything', p: 'The first and last hour of sunlight: low, warm, directional. Skin glows, textures carve, the world looks directed. This is the closest photography gets to cheating.' },
    { h: 'Backlight is the move', p: 'Put the sun behind your subject. You get rim light, glowing edges, and dreamy flare — meter for the subject and let the background bloom.' },
    { h: 'It ends. Plan for it.', p: 'Golden hour is short and the best light is the last ten minutes. Arrive early, compose first, shoot when it ignites. The sun does not wait.' }
  ], check: { q: 'Backlit golden-hour portrait, face too dark. Fix?',
    options: ['Shoot the sky instead', 'Add exposure compensation or a reflector', 'Switch to noon', 'Convert to B&W'],
    answer: 1, why: 'Backlight needs help on the shadow side — +EV or bounced light lifts the face.' } },
  drill: [
    { q: 'Best direction to shoot INTO at golden hour?',
      options: ['Away from the sun', 'Toward the sun for backlight and flare', 'Straight down', 'It does not matter'],
      answer: 1, why: 'Into the sun is where golden hour lives — glow, rims, atmosphere.' },
    { q: 'Long shadows at golden hour are…',
      options: ['A problem', 'Free leading lines and texture', 'An exposure error', 'Only for landscapes'],
      answer: 1, why: 'Low sun stretches every shadow into compositional gold.' },
    { q: 'White balance for golden hour?',
      options: ['Tungsten', 'Daylight or Shade — preserve the warmth', 'Auto always', 'Fluorescent'],
      answer: 1, why: 'Auto WB will "correct" the gold away. Lock it warm.' },
    { q: 'The light is perfect but you are not in position. You…',
      options: ['Shoot anyway from here', 'Scouted earlier, so you are already in position', 'Come back tomorrow', 'Use flash'],
      answer: 1, why: 'Golden hour rewards the prepared. Scout in harsh light, shoot in gold.' }
  ] },

/* ---------------- PORTRAITS ---------------- */
'portraits': {
  lesson: { cards: [
    { h: 'Eyes first, always', p: 'The nearest eye gets the focus point, every time. A portrait with soft eyes is a failed portrait — everything else is negotiable.' },
    { h: 'Focal length is perspective', p: '85–135mm flatters faces; 24mm distorts them. Step back and zoom in rather than crowding close — compression is kindness.' },
    { h: 'Direct, do not just shoot', p: '"Chin down a touch. Shoulders to me. Now laugh." Silence makes subjects freeze; gentle direction makes them bloom. You are the director.' }
  ], check: { q: 'Environmental portrait in a workshop. Lens and approach?',
    options: ['24mm close up', '50–85mm, subject doing something real', '200mm from across the street', 'Fisheye'],
    answer: 1, why: 'A natural focal length plus genuine action — the person belongs in their world.' } },
  drill: [
    { q: 'Harsh sun, no shade, must shoot the portrait now. You…',
      options: ['Shoot into the sun and expose for the face', 'Put the sun directly overhead', 'Give up', 'Use f/16'],
      answer: 0, why: 'Backlit + exposed for the face beats raccoon eyes every time.' },
    { q: 'Best background for a headshot?',
      options: ['Busy street', 'Simple, distant, blurred', 'A mirror', 'White wall 6 inches behind them'],
      answer: 1, why: 'Distance + wide aperture melts the background into nothing competing.' },
    { q: 'Subject blinks every shot. Fix?',
      options: ['Faster shutter', 'Count "3-2-1" and shoot on 1, or catch them talking', 'Brighter flash', 'New subject'],
      answer: 1, why: 'Predictable timing or mid-speech capture beats the blink reflex.' },
    { q: '85mm f/1.8 vs 35mm f/1.8 for a face. Difference?',
      options: ['None', '85mm compresses and flatters; 35mm close-up distorts', '35mm is sharper', '85mm is darker'],
      answer: 1, why: 'Perspective comes from distance. Longer lens = more distance = kinder faces.' }
  ] },

/* ---------------- LONG EXPOSURE ---------------- */
'long-exposure': {
  lesson: { cards: [
    { h: 'Time becomes a brush', p: 'Seconds-long exposures smear motion into silk — water, clouds, crowds dissolve while the still world stays sharp. You are painting with time.' },
    { h: 'Stillness is mandatory', p: 'Anything over ~1/30s needs support: tripod, wall, bag, ground. The camera must not move a millimeter while the shutter is open.' },
    { h: 'Too much light? Block it.', p: 'Daylight long exposures need an ND filter — sunglasses for your lens. Without one, the frame blows out in a second.' }
  ], check: { q: 'You want silky water at noon with no ND filter. Problem?',
    options: ['None — shoot at f/22, ISO 100', 'Even minimum settings overexpose in seconds; you need ND', 'Use flash', 'Shoot at night instead only'],
    answer: 1, why: 'Noon is too bright for multi-second exposures — an ND filter is the real answer.' } },
  drill: [
    { q: 'Classic starting point for silky water?',
      options: ['1/1000s', '1–4 seconds on support', '1/60s handheld', 'Bulb for an hour'],
      answer: 1, why: 'A few seconds melts water while keeping the scene manageable.' },
    { q: 'Car light trails at night need…',
      options: ['Fast shutter', '2–8 seconds, camera locked down', 'High ISO', 'Flash'],
      answer: 1, why: 'Long exposure lets the headlights draw ribbons through the dark.' },
    { q: 'People vanish from a 30-second city exposure because…',
      options: ['They are ghosts', 'They never stay still long enough to register', 'The camera deletes them', 'ISO too low'],
      answer: 1, why: 'Long exposures only record the still — the moving never imprint. Free crowd removal.' },
    { q: 'Bulb mode is for…',
      options: ['Flash', 'Exposures longer than 30s, held open manually', 'Portraits', 'Video'],
      answer: 1, why: 'Bulb holds the shutter open as long as you hold it — minutes, even hours.' }
  ] },

/* ---------------- NIGHT ---------------- */
'night': {
  lesson: { cards: [
    { h: 'Dark is a subject', p: 'Night photography is not "daytime but darker" — the dark is the material. Neon, windows, headlights, the moon: you photograph light sources, not lit things.' },
    { h: 'Expose for the lights', p: 'Meter the bright signs and let the shadows fall to black. Protect the highlights; crushed blacks are a feature at night, not a flaw.' },
    { h: 'Stability is everything', p: 'Night means slow shutters. Brace, tripod, or crank the ISO — pick your compromise deliberately. A sharp grainy photo beats a clean blurry one.' }
  ], check: { q: 'Neon sign at night, sign blown white, street black. Fix?',
    options: ['Raise ISO', 'Expose for the sign (faster shutter / −EV), let the street go dark', 'Use flash', 'Widen aperture'],
    answer: 1, why: 'The sign is the subject — expose for it and let the night be night.' } },
  drill: [
    { q: 'Handheld night street, 35mm, no stabilization. Safe floor?',
      options: ['1/8s', '1/40s or faster, then raise ISO', '1 second', '30 seconds'],
      answer: 1, why: 'Respect the handshake limit, then let ISO do the lifting.' },
    { q: 'Stars as points (not trails) need…',
      options: ['30 seconds', 'The 500 rule: 500 ÷ focal length = max seconds', 'f/22', 'Flash'],
      answer: 1, why: '500/24mm ≈ 20s. Longer and the Earth\'s rotation smears the stars.' },
    { q: 'City night looks orange. Fix in camera?',
      options: ['Raise ISO', 'Set Tungsten white balance', 'Faster shutter', 'It is fine'],
      answer: 1, why: 'Sodium streetlights are tungsten-orange. Tungsten WB neutralizes them.' },
    { q: 'Best nights for city shooting?',
      options: ['Pitch black', 'Just after rain — wet streets double the neon', 'Fog only', 'Full moon only'],
      answer: 1, why: 'Wet asphalt is a mirror. Rain turns every street into a light show.' }
  ] },

/* ---------------- STREET ---------------- */
'street': {
  lesson: { cards: [
    { h: 'The theater of the ordinary', p: 'Street photography is unposed life — gestures, juxtapositions, fleeting geometry. The street is the most honest studio you will ever walk through.' },
    { h: 'Be ready before it happens', p: 'Pre-set exposure, zone-focus or continuous AF, camera up. Decisive moments last half a second; settings take longer. Decide before the scene does.' },
    { h: 'Get close, be kind', p: 'The best street work is made near, not far. Smile, nod, keep moving. Confidence and courtesy open more doors than a long lens.' }
  ], check: { q: 'A perfect gesture unfolds across the street. You fumble with settings and miss it. Lesson?',
    options: ['Better camera needed', 'Pre-set everything; the moment will not wait for menus', 'Shoot wider next time', 'It was luck anyway'],
    answer: 1, why: 'Street rewards the prepared. Settings first, moments second.' } },
  drill: [
    { q: 'Best focal length tradition for street?',
      options: ['200mm', '28–50mm — in the scene, not spying on it', '8mm fisheye', '600mm'],
      answer: 1, why: 'Wide-normal puts you inside the moment. Long lenses watch from outside.' },
    { q: 'Harsh midday street light. Hunt for…',
      options: ['Open plazas', 'Hard shadows and graphic contrast', 'Indoor cafes only', 'Nothing — go home'],
      answer: 1, why: 'Midday hard light is a graphic tool: shadows become subjects.' },
    { q: 'Someone objects to being photographed. You…',
      options: ['Argue your rights', 'Smile, apologize, delete if asked, move on', 'Shoot anyway', 'Hide the camera'],
      answer: 1, why: 'Decency first. The street is shared; no photo is worth a conflict.' },
    { q: 'Zone focusing means…',
      options: ['Auto everything', 'Pre-focusing to a set distance so the shot is instant', 'Only the center zone', 'Manual white balance'],
      answer: 1, why: 'f/8 at 3 meters — everything from 2 to 5m is sharp, no AF delay.' }
  ] },

/* ---------------- EDITING ---------------- */
'editing': {
  lesson: { cards: [
    { h: 'Edit the photo you took', p: 'Editing reveals; it does not rescue. The best edit starts with strong raw material — exposure, moment, composition decided in the field.' },
    { h: 'The honest order', p: 'Crop and straighten → exposure and white balance → contrast and color → sharpen last. Global corrections before local ones, always.' },
    { h: 'Taste is restraint', p: 'If someone notices the edit, there is too much of it. Pull every slider until it feels right, then back off 20%. Subtle wins.' }
  ], check: { q: 'Your edit looks crunchy and overcooked. The fix?',
    options: ['More clarity', 'Dial everything back — restraint is the edit', 'A new preset', 'More saturation'],
    answer: 1, why: 'Over-editing is the beginner\'s signature. Less is the pro move.' } },
  drill: [
    { q: 'Shoot RAW or JPEG for serious editing?',
      options: ['JPEG — smaller', 'RAW — full data, full latitude', 'It does not matter', 'PNG'],
      answer: 1, why: 'RAW keeps every stop of dynamic range. JPEG bakes decisions in.' },
    { q: 'First slider to touch on a new photo?',
      options: ['Saturation', 'Crop/straighten and exposure', 'Vignette', 'Grain'],
      answer: 1, why: 'Geometry and exposure are the foundation; style comes after.' },
    { q: 'Blown highlights in JPEG are…',
      options: ['Recoverable', 'Gone — no data to recover', 'Fixable with contrast', 'Fine'],
      answer: 1, why: 'Clipped is clipped. Expose for the highlights; shadows forgive more.' },
    { q: 'A preset is…',
      options: ['Cheating', 'A starting point — adjust to the photo', 'The final answer', 'Only for pros'],
      answer: 1, why: 'Presets are suggestions. Every photo needs its own finish.' }
  ] },

};
