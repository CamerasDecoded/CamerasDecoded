/* ============================================================================
   FIELD MANUAL — Guide content data
   ----------------------------------------------------------------------------
   HOST ONLY. Do NOT commit this file to the public GitHub repo.
   It contains paid guide content. Upload it directly to the live host at
   /scripts/guide-data.js alongside field-manual.html.

   Pilot: Chapter 03 — The Fundamentals (guide pages 31–42).
   Transcribed 2026-09-17 from the owner's Canva export images.
   Two source pages still pending: "Mode Dial Explained" Part 1 and
   "Exposure Triangle" Part 1 — their slots are marked in pendingParts below.
   ============================================================================ */
window.GUIDE_DATA = {
  version: "2026-09-17-ch03",
  chapters: [
    {
      id: "ch03",
      num: "03",
      title: "The Fundamentals",
      tagline: "This is where we explore the \u201Cscience\u201D of the camera.",
      includes: ["Mode Dial", "Exposure Triangle", "Focus Demystified"],
      transmission:
        "Fundamentals incoming. Three systems: the mode dial, the exposure triangle, focus. " +
        "This is the science of the camera \u2014 learn it once, and every shoot after this gets quieter.",
      lessons: [
        {
          id: "ch03-mode-dial",
          title: "Mode Dial Explained",
          xp: 20,
          pendingParts: [],
          parts: [
            {
              kicker: "Part 1",
              heading: "The Mode Dial\u2014Which One Should You Actually Use?",
              blocks: [
                { t: "h", text: "The MODE DIAL: Your Creative Compass" },
                {
                  t: "p",
                  text: "Remember Jim? His frustration stemmed from a single dial. He stayed in \u201CAuto\u201D and expected \u201CArt.\u201D To avoid his fate, you must understand that the Mode Dial is not just a menu of settings; it is a declaration of who is in control."
                },
                {
                  t: "p",
                  text: "Most mirrorless camera series standardize these four letters (P, S/Tv, A/Av, M). Think of this dial as a sliding scale between \u201CThe Camera Decides\u201D and \u201CYou Decide.\u201D"
                },
                {
                  t: "spec",
                  title: "P (Program Auto): The \u201CSmart\u201D Starting Point",
                  rows: [
                    ["Function", "The camera sets both shutter speed and aperture, but allows you to adjust ISO and White Balance."],
                    ["Use Case", "Fast-paced street photography or family events where things are moving quickly, but you still want a say in the \u201Clook\u201D of the light."],
                    ["Care Tip", "This is the safest transition out of Full Auto. Don\u2019t be afraid to experiment here first!"]
                  ]
                },
                {
                  t: "spec",
                  title: "A or Av (Aperture Priority): The Portrait Master",
                  rows: [
                    ["Function", "You choose the Aperture (the \u201Cf-number\u201D); the camera handles the rest. This controls your Depth of Field."],
                    ["Use Case", "Use a low number (like f/1.8 or f/2.8) to get that creamy, blurred background in portraits. Use a high number (f/11) for sharp, sweeping landscapes."],
                    ["Pro Secret", "This is the mode 90% of professional wedding and portrait photographers use most often."]
                  ]
                },
                {
                  t: "spec",
                  title: "S or Tv (Shutter Priority): The Action Hero",
                  rows: [
                    ["Function", "You choose the Shutter Speed; the camera adjusts the aperture to match."],
                    ["Use Case", "Freezing a soccer player in mid-air (1/1000 sec) or intentionally blurring a waterfall to look like silk (1/2 sec)."],
                    ["Care Tip", "Use a tripod for slow shutter speeds, or your \u201Cartistic blur\u201D will just look like a \u201Cshaky mistake.\u201D"]
                  ]
                },
                {
                  t: "spec",
                  title: "M (Manual): Total Creative Freedom",
                  rows: [
                    ["Function", "You control everything\u2014Aperture, Shutter Speed, and ISO. No safety nets."],
                    ["Use Case", "Studio photography, night skies (astrophotography), or tricky lighting where the camera\u2019s \u201Cbrain\u201D gets confused."],
                    ["The Reality", "It takes practice. Don\u2019t rush here on Day 1. Master A and S first."]
                  ]
                }
              ]
            },
            {
              kicker: "Part 2",
              heading: "The Mode Dial \u2014 Which One Should You Actually Use?",
              blocks: [
                { t: "h", text: "High-end mirrorless cameras include specialized slots for efficiency" },
                {
                  t: "list",
                  items: [
                    {
                      label: "C1, C2, C3 \u2013 Custom Modes",
                      text: "These act as \u201Cpresets\u201D. You can save entire groups of settings (ISO, focus mode, frame rate) and recall them instantly."
                    },
                    {
                      label: "Example",
                      text: "Save C1 for fast-moving birds (High Shutter, Auto ISO, Burst Mode) and C2 for portraits (Low f-stop, Eye-AF)."
                    },
                    {
                      label: "B \u2013 Bulb Mode",
                      text: "Allows the shutter to stay open as long as you hold the button. This is used for extreme long exposures, often exceeding 30 seconds."
                    }
                  ]
                },
                { t: "h", text: "Utility and Automatic Modes" },
                {
                  t: "list",
                  items: [
                    {
                      label: "Auto (Green Icon)",
                      text: "The \u201CPoint and Shoot\u201D mode. The camera decides everything, including if the flash should fire."
                    },
                    {
                      label: "SCN (Scene Modes)",
                      text: "Pre-programmed settings for specific looks (Portrait, Landscape, Sports). While helpful for pure beginners, advanced beginners should move past these to PASM for more consistent results."
                    }
                  ]
                }
              ]
            }
          ],
          recap: {
            status: "Navigation Set",
            goldenRule:
              "The \u201CAuto\u201D (Green) mode is the \u201CBlue Pill.\u201D To see how far the rabbit hole goes, you have to move into the \u201CCreative Zone\u201D (P, A, S, M).",
            logic: [
              {
                label: "A/Av (Aperture Priority)",
                text: "Use this 80% of the time for portraits and street photography."
              },
              {
                label: "S/Tv (Shutter Priority)",
                text: "Use this for sports or when you want to \u201Cfreeze\u201D time."
              },
              {
                label: "M (Manual)",
                text: "The ultimate goal. Total control over the Matrix."
              }
            ],
            takeaway:
              "Don\u2019t be afraid to leave \u201CAuto.\u201D The camera is smart, but it doesn\u2019t have your creative eye."
          },
          quiz: {
            title: "Mode Dial: System Check",
            scenario:
              "You\u2019re at a high-school basketball game. The players are moving fast, and your photos are coming out blurry because the camera is choosing a slow shutter speed.",
            questions: [
              {
                q: "Switch to which mode so YOU can lock in a fast Shutter Speed while the camera handles the rest?",
                choices: ["A) A / Av (Aperture Priority)", "B) S / Tv (Shutter Priority)", "C) Program (P)"],
                answer: 1,
                reveal: "S/Tv lets you command the speed."
              },
              {
                q: "You\u2019re shooting a landscape at sunset & want everything from the front rock to the distant mountains to be sharp. Which mode is best for controlling \u201Cdepth\u201D?",
                choices: ["A) A / Av (Aperture Priority)", "B) S / Tv (Shutter Priority)", "C) Auto (The Green Icon)"],
                answer: 0,
                reveal: "A/Av lets you command the Aperture/Depth."
              }
            ]
          }
        },
        {
          id: "ch03-exposure",
          title: "Exposure Triangle",
          xp: 20,
          pendingParts: [],
          parts: [
            {
              kicker: "Part 1",
              heading: "Master the balance between aperture, shutter speed & ISO",
              blocks: [
                {
                  t: "p",
                  text: "Now, let\u2019s dig into the exposure triangle\u2014the three interdependent pillars that determine every image\u2019s brightness and character: aperture, shutter speed, and ISO. Think of them as three variables that work together like a balance scale; if you adjust one, you must compensate with at least one other to maintain the same overall brightness (exposure). The magic of a mirrorless camera is that you can see these changes happen in real time through the electronic viewfinder (EVF) or rear screen, making the triangle far less abstract than it was in the film days."
                },
                { t: "h", text: "SS \u2014 Shutter Speed" },
                {
                  t: "p",
                  text: "Shutter Speed is the duration the sensor is exposed to light, measured in seconds or fractions of a second (e.g., 1/500, 1/60, 1\u201D). Faster speeds (like 1/1000) freeze motion\u2014perfect for a running dog or a bird in flight. Slower speeds (like 1/30 or slower) introduce motion blur; used deliberately, they can convey movement (like silky waterfalls), but accidentally they result in camera shake that ruins sharpness. A good rule of thumb for handheld shooting is to keep shutter speed at least at 1/(focal length) seconds\u2014for a 50mm lens, that\u2019s 1/50 or faster\u2014though your camera\u2019s in-body stabilization (IBIS) or lens-based stabilization can let you go slower. In Shutter Priority (S or Tv) mode, you control this value while the camera picks aperture; but when learning, many photographers use Aperture Priority and let the camera choose shutter speed, watching to ensure it doesn\u2019t dip too low (the camera may warn you with a shake icon)."
                },
                { t: "h", text: "AV/AVP \u2014 Aperture" },
                {
                  t: "p",
                  text: "Aperture (the f-number, like f/2.8, f/8) controls the size of the lens opening. A lower f-number means a wider opening, letting in more light and creating a shallow depth of field\u2014that soft, blurred background (bokeh) that separates your subject from the scene. A higher f-number (stopping down) gives you greater depth of field, keeping more of the scene sharp from foreground to background, which is ideal for landscapes or group photos. On your camera, you\u2019ll typically adjust aperture using the front dial (or a ring on the lens) when you\u2019re in Aperture Priority (A or Av) mode. Watch the EVF: as you spin the dial, you\u2019ll see the image brightness change, but more importantly, you\u2019ll see the depth of field shift in real time\u2014a superpower only mirrorless cameras give you without having to take a test shot."
                },
                { t: "h", text: "ISO" },
                {
                  t: "p",
                  text: "ISO is the sensor\u2019s sensitivity to light. Lower ISO (100, 200) gives you the cleanest image with the least digital noise (grain). Higher ISO (3200, 6400, and beyond) lets you shoot in dim conditions without slowing shutter speed too much, but at the cost of increasing noise and reducing color fidelity. On a modern mirrorless camera, setting Auto ISO with a reasonable maximum sensitivity (say, 6400 for APS-C sensors, 12800 for full-frame) and a minimum shutter speed (e.g., 1/125) is a smart way to let the camera balance the triangle while you concentrate on aperture and composition. You can set these limits in the menu under ISO settings; they act as a safety net, ensuring the camera never chooses a shutter speed too slow for your subject or an ISO so high that the image falls apart."
                }
              ]
            },
            {
              kicker: "Part 2",
              heading: "Master the balance between aperture, shutter speed & ISO",
              blocks: [
                {
                  t: "p",
                  text: "The key to internalizing the triangle is to use your camera\u2019s exposure compensation dial (the little +/\u2013 dial near the shutter button). In Aperture Priority or Shutter Priority, this dial lets you intentionally over- or under-expose the image without leaving the semi-automatic mode. Want a bright, airy portrait? Dial +0.7 or +1.0. Preserving highlight detail in a sunset? Dial \u20131.0. The EVF shows the result instantly\u2014no guesswork. For a deeper check, enable the live histogram (usually a mountain-shaped graph in the display). If the graph is bunched up against the right edge, highlights are clipping (pure white); if against the left edge, shadows are losing detail. Aim to \u201Cexpose to the right\u201D (ETTR) just short of clipping for the cleanest files, especially when shooting RAW."
                },
                {
                  t: "p",
                  text: "As you practice, treat the triangle like a language. Set your camera to Aperture Priority, Auto ISO with limits, and spend a day shooting everything at f/2.8 to see how the camera chooses faster shutter speeds in bright light. Then spend an afternoon at f/11, noticing how shutter speeds drop and ISO rises to compensate, but the depth of field transforms your landscapes."
                },
                {
                  t: "p",
                  text: "Soon you\u2019ll instinctively know: when light drops, you can open the aperture, slow the shutter, or raise ISO\u2014or a combination of all three. Mirrorless cameras make this tangible: every dial turn, every ISO limit you set, shows up immediately in the viewfinder, turning a technical concept into a visual, intuitive skill."
                }
              ]
            }
          ],
          recap: {
            status: "Balanced",
            goldenRule:
              "Light is a currency. To get a \u201Cbright\u201D image, you have to pay for it with either a wider Aperture, a slower Shutter, or a higher ISO.",
            logic: [
              {
                label: "Aperture",
                text: "Controls the \u201CLook\u201D (Blurry backgrounds)."
              },
              {
                label: "Shutter",
                text: "Controls the \u201CMoment\u201D (Action vs. Motion)."
              },
              {
                label: "ISO",
                text: "Controls the \u201CCleanliness\u201D (Grain vs. Smooth)."
              }
            ],
            takeaway: "If you move one corner of the triangle, the other two must react."
          },
          quiz: {
            title: "Exposure Triangle: System Check",
            scenario:
              "You are shooting in Manual Mode. Your settings are: ISO 100, Shutter 1/500, and Aperture f/2.8. The image looks perfect, but suddenly a cloud covers the sun and your image becomes too dark.",
            questions: [
              {
                q: "To keep your \u201Cblurry background\u201D (f/2.8) & your \u201Cfrozen motion\u201D (1/500), which setting MUST change to fix brightness?",
                choices: ["A) Increase the ISO.", "B) Decrease the ISO.", "C) Speed up the Shutter."],
                answer: 0,
                reveal: "Increasing ISO increases sensitivity to light."
              },
              {
                q: "You decide to slow your Shutter Speed down to 1/50 to let in more light. What is the potential \u201Cglitch\u201D you might see in your photo?",
                choices: [
                  "A) The background will get sharper.",
                  "B) The photo might have \u201CMotion Blur\u201D or camera shake.",
                  "C) The colors will turn Black and White."
                ],
                answer: 1,
                reveal: "Slow shutters capture movement."
              }
            ]
          }
        },
        {
          id: "ch03-focus",
          title: "Focus Demystified",
          xp: 20,
          pendingParts: [],
          parts: [
            {
              kicker: "Part 1",
              heading: "Autofocus modes to the precision of manual focusing",
              blocks: [
                {
                  t: "p",
                  text: "Now, let\u2019s tackle the feature that often intimidates newcomers more than any other: Focus."
                },
                {
                  t: "p",
                  text: "Mirrorless cameras have revolutionized focusing because the autofocus system lives directly on the imaging sensor\u2014meaning what you see in the viewfinder is exactly what the sensor sees, with no calibration guesswork. This gives you tools that were once reserved for high-end professional gear, but they require a bit of understanding to wield effectively."
                },
                {
                  t: "p",
                  text: "Start with the two most important autofocus modes: AF-S (Single) and AF-C (Continuous)."
                },
                {
                  t: "p",
                  text: "In AF-S, the camera locks focus once when you press the shutter button halfway, and holds it until you take the shot. This is ideal for stationary subjects like landscapes, still life, or posed portraits."
                },
                {
                  t: "p",
                  text: "In AF-C (Continuous), the camera continuously adjusts focus as long as you hold the button halfway (or use back-button focus), tracking movement in real time. This is the go-to for anything that moves: kids playing, pets, street photography, or wildlife."
                },
                {
                  t: "p",
                  text: "Many mirrorless cameras also offer AF-A (Auto), which switches between the two based on subject movement\u2014handy when you\u2019re not sure, but learning to deliberately choose AF-S or AF-C gives you more control as well as a better understanding."
                },
                {
                  t: "p",
                  text: "Next, you\u2019ll encounter AF area modes\u2014the pattern of focus points the camera uses. The options vary by brand but generally fall into a few types:"
                },
                {
                  t: "list",
                  items: [
                    {
                      label: "Single Point / Flexible Spot",
                      text: "You manually place a small focus point exactly where you want critical sharpness. Best for precise control, such as portraits where you want the eye tack sharp, or macro work."
                    },
                    {
                      label: "Zone / Expanded Flexible Spot",
                      text: "A cluster of points that gives the camera more room to track within a defined area. Great when your subject is moving erratically but you want to keep focus in a specific region of the frame."
                    },
                    {
                      label: "Wide / Auto Area",
                      text: "The camera uses the entire sensor to identify and lock onto subjects, often prioritizing faces or the closest object. This is the most \u201Cpoint-and-shoot\u201D option and works surprisingly well with modern subject-recognition algorithms."
                    },
                    {
                      label: "Tracking",
                      text: "A mode where you place a focus box on a subject, and the camera follows it as it moves across the frame. On most mirrorless cameras, tracking is now integrated with wide area or subject recognition\u2014you simply half-press to engage tracking, then recompose while the camera holds onto the subject."
                    }
                  ]
                }
              ]
            }
          ],
          recap: {
            status: "Target Locked",
            goldenRule:
              "Sharpness isn\u2019t luck; it\u2019s a choice. If the camera isn\u2019t focusing where you want, you haven\u2019t given it a specific enough command.",
            logic: [
              {
                label: "AF-C (Continuous)",
                text: "The standard for 2026. Use it for anything that breathes or moves."
              },
              {
                label: "Eye-Tracking",
                text: "Your \u201CCheat Code.\u201D Turn it on and let the AI handle the precision while you handle the framing."
              },
              {
                label: "Focus Area",
                text: "Use \u201CSmall Spot\u201D when you need to thread the needle through foreground distractions."
              }
            ],
            takeaway:
              "If your images are still blurry, check your shutter speed. Focus gets the blame, but motion blur is often the real \u201Cglitch.\u201D"
          },
          quiz: {
            title: "Focus Demystified: System Check",
            scenario:
              "You\u2019re at a park. Your friend is walking toward you, and you want to take a \u201Cwalking shot.\u201D Every time you press the button, the camera focuses on the background trees instead.",
            questions: [
              {
                q: "Which Focus Mode (AF) should you engage to track your friend as they move?",
                choices: ["A) AF-S (Single)", "B) AF-C (Continuous)", "C) MF (Manual Focus)"],
                answer: 1,
                reveal: "AF-C \u201Csticks\u201D to moving targets."
              },
              {
                q: "If the camera keeps focusing on the trees behind them, which \u201CFocus Area\u201D should you switch to for more precision?",
                choices: [
                  "A) Wide (The camera chooses)",
                  "B) Small Spot / Flexible Spot (You choose)",
                  "C) Multi-Point"
                ],
                answer: 1,
                reveal: "A Small Spot tells the camera exactly where to look."
              }
            ]
          }
        }
      ]
    }
  ]
};
