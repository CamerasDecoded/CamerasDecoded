/* Cameras Decoded — shared industry glossary.
   Term data for the tap-to-define system. Used by scripts/glossary-modal.js
   (Field Manual today; industry terms page, learning game, course next).
   Keep definitions plain-spoken, one idea per term. No affiliate links. */
(function(){
  "use strict";

  /* short: one-liner shown under the term in the modal header.
     long: 2-4 sentence plain-English explanation shown in the modal body. */
  var TERMS = [
    { term: "Aperture",
      short: "The opening in the lens that lets light in.",
      long: "Aperture is the adjustable opening inside your lens. A wide aperture (small f-number like f/1.8) lets in lots of light and blurs the background; a narrow aperture (big f-number like f/11) lets in less light but keeps more of the scene sharp. It is one of the three sides of the exposure triangle." },
    { term: "Shutter speed",
      short: "How long the sensor is exposed to light.",
      long: "Shutter speed is the length of time your camera's sensor collects light for one photo — from fractions like 1/1000s down to whole seconds. Fast speeds freeze motion; slow speeds blur it (which can be beautiful for waterfalls or light trails, disastrous for hand-held shots). It is the second side of the exposure triangle." },
    { term: "ISO",
      short: "How sensitive the sensor is to light.",
      long: "ISO controls how sensitive your camera's sensor is to light. Low ISO (100–400) gives the cleanest image; high ISO (3200+) lets you shoot in the dark but adds grainy noise. It is the third side of the exposure triangle — raise it only when aperture and shutter speed can't get you there." },
    { term: "Exposure",
      short: "The total amount of light captured in a photo.",
      long: "Exposure is simply how much light your sensor collected — too little and the photo is dark (underexposed), too much and highlights blow out to white (overexposed). Aperture, shutter speed, and ISO work together to set it." },
    { term: "Exposure triangle",
      short: "Aperture, shutter speed, and ISO — the three-way trade-off.",
      long: "The exposure triangle is the relationship between aperture, shutter speed, and ISO. Change one and at least one of the others must move to keep the same exposure. Mastering the triangle is what moves you from auto mode to intentional shooting." },
    { term: "Depth of field",
      short: "How much of the photo is in sharp focus, front to back.",
      long: "Depth of field is the zone of acceptable sharpness in front of and behind your focus point. Shallow depth of field (wide aperture, long lens, close subject) melts the background — the classic portrait look. Deep depth of field (narrow aperture) keeps a whole landscape sharp." },
    { term: "Focal length",
      short: "The lens's magnification, measured in millimeters.",
      long: "Focal length, measured in mm, describes a lens's angle of view and magnification. Short lengths (16–35mm) are wide — big scenes, dramatic perspective. Long lengths (85mm+) are telephoto — compressed, intimate, great for portraits and sports. On crop-sensor bodies, multiply by the crop factor to get the effective length." },
    { term: "White balance",
      short: "What your camera decides is 'true white.'",
      long: "White balance tells your camera what neutral white looks like under the current light, so colors render naturally. Get it wrong and indoor shots go orange, shade goes blue. Shoot RAW and you can fix it perfectly after the fact; shoot JPEG and you should set it in-camera." },
    { term: "Metering",
      short: "How the camera measures light to pick an exposure.",
      long: "Metering is your camera's way of reading the scene's brightness to suggest an exposure. Matrix/evaluative reads the whole frame; center-weighted favors the middle; spot reads one tiny point — the precise choice for backlit portraits and stage lighting." },
    { term: "Histogram",
      short: "A graph of the brightness values in your photo.",
      long: "The histogram is a bar graph showing how your photo's tones are distributed, from pure black on the left to pure white on the right. A graph slammed against either edge means clipped detail — lost forever. It is the only honest exposure judge; your screen lies in bright sunlight." },
    { term: "RAW",
      short: "The unprocessed sensor data — maximum editing room.",
      long: "A RAW file is the raw, unprocessed data straight off your sensor. Files are big, but you get enormous latitude to fix exposure, white balance, and shadows afterward. Think of it as a digital negative. JPEG is the finished print — convenient, but most of the data is already thrown away." },
    { term: "JPEG",
      short: "The finished, compressed photo — small files, less editing room.",
      long: "JPEG is the standard finished-photo format: small files, universally readable, with the camera's processing (sharpening, color, white balance) baked in. Great for sharing straight out of camera; limiting if you need to rescue exposure or color later. That's the RAW vs JPEG trade-off." },
    { term: "Crop factor",
      short: "The multiplier that converts lens mm on smaller sensors.",
      long: "Crop factor describes how much smaller your sensor is than full-frame (1.5x for most Sony/Nikon/Fuji APS-C, 1.6x for Canon, 2x for Micro Four Thirds). Multiply a lens's focal length by it: a 50mm lens on a 1.5x body frames like a 75mm. It changes field of view, not the lens itself." },
    { term: "Bokeh",
      short: "The quality of the out-of-focus blur.",
      long: "Bokeh (pronounced BOH-kay) is the aesthetic quality of out-of-focus areas — creamy and smooth is the goal. Wide apertures, longer focal lengths, and distance between subject and background all increase it. Not all blur is good blur; harsh, jittery bokeh distracts." },
    { term: "Dynamic range",
      short: "How much detail the sensor holds from shadows to highlights.",
      long: "Dynamic range is the span from the darkest shadow detail to the brightest highlight detail your sensor can capture in one shot. Scenes that exceed it — bright sky plus dark foreground — force a choice: expose for one, or bracket and blend." },
    { term: "Noise",
      short: "The grainy speckles that appear at high ISO.",
      long: "Noise is the random grainy speckle that creeps in as ISO climbs, plus some in deep shadows. Modern mirrorless bodies handle it far better than old DSLRs, and mild noise beats a blurry shot every time — but the cleanest image always comes from the lowest ISO the situation allows." },
    { term: "Image stabilization",
      short: "Hardware that counteracts hand shake.",
      long: "Image stabilization (IBIS in-body, OIS in-lens) physically counteracts small hand movements, letting you shoot at slower shutter speeds than your hands could otherwise manage — often 3 to 7 stops slower. It saves static scenes; it cannot freeze a moving subject." },
    { term: "Bracketing",
      short: "Shooting several exposures to blend later.",
      long: "Bracketing fires a burst of shots at different exposures (usually −2, 0, +2) so you can blend them into one image with detail everywhere — the classic HDR workflow for high-contrast scenes like sunsets over dark landscapes." },
    { term: "Rule of thirds",
      short: "Place subjects on the grid lines, not dead center.",
      long: "The rule of thirds divides your frame into a 3×3 grid; placing key subjects along the lines or at their intersections usually makes a stronger composition than centering everything. It is a starting point, not a law — learn it, then break it on purpose." },
    { term: "Shutter",
      short: "The mechanism (or electronic process) that starts and stops the exposure.",
      long: "The shutter is what begins and ends each exposure. Mechanical shutters use physical curtains (with a satisfying click); electronic shutters read the sensor silently — great for weddings and wildlife, though they can distort very fast motion (rolling shutter)." }
  ];

  window.CDGlossaryData = { terms: TERMS };
})();
