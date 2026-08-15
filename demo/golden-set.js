// Golden evaluation set: 22 labeled cases drawn from the public Ingenuity flight record.
// Each case pins an expected anomaly category and a reference narrative authored from the
// public record. The Evals tab scores the narrative layer's output against these labels:
// exact match on category, and an LLM-as-judge score (1 to 5) on narrative quality
// (category correctness, grounding in the record, calibration of confidence).
// Judge: Claude, cached evaluation run. Every case has a full trace in the Evals tab.
window.TRIAGE_GOLDEN = [
 {
  "flight": 1,
  "expected_category": "planned-deviation",
  "reference": "First powered flight on another planet: a short vertical hover with a planned rotation and no traverse. Duration falls below the fleet envelope because of the profile, not a fault.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correct category, cites the hover profile as the cause of the duration flag, and does not invent detail beyond the record."
  }
 },
 {
  "flight": 3,
  "expected_category": "nominal",
  "reference": "A 50 meter out and back at 2 m/s, completed cleanly with a landing at the departure spot. All metrics inside the envelope.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Matches the reference on category and substance, including the return to the departure point."
  }
 },
 {
  "flight": 6,
  "expected_category": "navigation-anomaly",
  "reference": "In-flight navigation anomaly: a dropped navigation image caused subsequent frames to carry wrong timestamps, producing oscillations the vehicle survived. Metrics alone look normal, so the record note is the evidence.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Identifies the image pipeline glitch, explains why envelope statistics miss it, and keeps confidence high, which the detailed record supports."
  }
 },
 {
  "flight": 9,
  "expected_category": "nominal",
  "reference": "An ambitious crossing of uneven Seitah terrain that stressed the flat-ground navigation assumption. Controllers slowed the vehicle over the roughest stretch and the flight completed inside the envelope. Nominal, with context worth reading.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correctly resists over-flagging: the navigation stress was managed and the flight completed as planned. Medium confidence is a reasonable calibration choice."
  }
 },
 {
  "flight": 12,
  "expected_category": "nominal",
  "reference": "Stereo imaging run with an offset return path. Completed inside the envelope; the record calls it decisive for rover route planning.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Accurate and grounded, including the stereo imaging purpose."
  }
 },
 {
  "flight": 14,
  "expected_category": "operational-incident",
  "reference": "A servo motor anomaly automatically canceled the first attempt. The eventual flight was a brief hop verifying the faster 2700 rpm rotor setting, which explains the short duration flag. The pre-flight abort is the event of record.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Captures both the servo abort and the reason the reflight was deliberately short, and ranks the abort as the defining event."
  }
 },
 {
  "flight": 17,
  "expected_category": "communications-loss",
  "reference": "Radio link to the rover lost during final descent, about 3 meters up, blocked by terrain. JPL judged the flight successful from received data and the link was restored. In-flight communications loss in the landing phase.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correct category and phase, includes the terrain cause and the eventual recovery without overstating severity."
  }
 },
 {
  "flight": 19,
  "expected_category": "operational-incident",
  "reference": "First weather delay for an aircraft on another planet: a dust storm postponed the first attempt. The flight itself, a climb out of South Seitah, completed inside the envelope.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Names the dust storm postponement as the event of record and keeps the flight itself nominal."
  }
 },
 {
  "flight": 22,
  "expected_category": "early-termination",
  "reference": "The vehicle flew 70.4 meters of a planned roughly 350 meter leg. The record gives no cause, so the classification is early termination with hedged confidence. Metrics alone would read nominal, which is exactly why the plan-versus-actual comparison matters.",
  "judge": {
   "score": 4,
   "pass": true,
   "rationale": "Correct category and well calibrated hedging given the sparse record. Loses a point for not spelling out that the envelope statistics alone would have missed this, which is the instructive part of the case."
  }
 },
 {
  "flight": 30,
  "expected_category": "planned-deviation",
  "reference": "First flight after the dust season and a two month stand down, deliberately short to confirm targeting accuracy after inactivity, preceded by planned rotor spin health checks. The duration flag is the checkout profile.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Attributes the flag to the deliberate checkout profile and correctly treats the spin tests as routine rather than incidents."
  }
 },
 {
  "flight": 34,
  "expected_category": "planned-deviation",
  "reference": "An 18 second pop-up exercising the fourth software update for steep delta terrain. The extreme duration and traverse flags are the test profile itself.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Reads the flags as the checkout objective, matching the reference."
  }
 },
 {
  "flight": 43,
  "expected_category": "nominal",
  "reference": "Start of a frequent-flight cadence to stay ahead of the rover's no-fly exclusion zone in the canyon. Inside the envelope, no anomalies.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Accurate, includes the operational context for the cadence change."
  }
 },
 {
  "flight": 49,
  "expected_category": "operational-incident",
  "reference": "Two pre-flight aborts: wind-cooled battery below check levels, then a minor command sequencing glitch. The flight then scouted Belva Crater inside the envelope. The aborts are the events of record.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Lists both abort causes and keeps the flight itself nominal, matching the reference."
  }
 },
 {
  "flight": 50,
  "expected_category": "planned-deviation",
  "reference": "Climb to 18 meters, above the fleet envelope, during deliberate envelope expansion in rugged terrain. The preceding terrain-driven communications blackout with the rover is context between flights, not an in-flight event.",
  "judge": {
   "score": 4,
   "pass": true,
   "rationale": "Correctly separates the between-flight blackout from in-flight events, which is the trap in this case. Slightly long, and the confidence hedge could be justified more crisply."
  }
 },
 {
  "flight": 53,
  "expected_category": "early-termination",
  "reference": "Automatic contingency landing: the onboard LAND_NOW program cut the low scouting flight short before its planned climb. A protective termination, confirmed by the follow up investigation and the flight 54 checkout.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Names the contingency program, distinguishes protective automation from failure, and links to the follow up flight."
  }
 },
 {
  "flight": 54,
  "expected_category": "planned-deviation",
  "reference": "A 24 second diagnostic pop-up flown after the flight 53 investigation to test software changes and confirm the autoland cause. The short duration flag is the diagnostic profile.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correctly ties the flight to the 53 investigation and reads the flag as intended behavior."
  }
 },
 {
  "flight": 59,
  "expected_category": "planned-deviation",
  "reference": "Pop-up to a record 20 meter altitude with near zero traverse, characterizing performance at height. The altitude flag is the objective.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Matches the reference exactly on category and cause."
  }
 },
 {
  "flight": 61,
  "expected_category": "planned-deviation",
  "reference": "Envelope expansion pop-up to a record 24 meters. The altitude flag reflects the test objective.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correct category, grounded, appropriately brief."
  }
 },
 {
  "flight": 62,
  "expected_category": "planned-deviation",
  "reference": "Envelope expansion to a record 10 m/s groundspeed at 18 meters, flagging speed and altitude. Both deviations are the planned profile.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Explains both flags against the planned test, matching the reference."
  }
 },
 {
  "flight": 67,
  "expected_category": "nominal",
  "reference": "Flown after the planned solar conjunction communications pause. The reposition completed inside the envelope. The pause is planned mission design, not an incident.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Correctly declines to classify the conjunction pause as an incident, which is the trap in this case."
  }
 },
 {
  "flight": 71,
  "expected_category": "early-termination",
  "reference": "Terminated early for technical reasons, per the record, with the short duration flag in agreement. Cause unstated publicly, so confidence should be hedged and the flight 72 checkout referenced.",
  "judge": {
   "score": 4,
   "pass": true,
   "rationale": "Correct category and appropriately hedged. The sparse record limits the narrative; it does point forward to the flight 72 checkout as the reference expects."
  }
 },
 {
  "flight": 72,
  "expected_category": "communications-loss",
  "reference": "System checkout after flight 71. Climbed to assigned altitude, then lost communication with the rover about one meter above the surface during descent. Ingenuity was permanently grounded afterward. The in-flight event is the link loss; the grounding followed post-flight assessment.",
  "judge": {
   "score": 5,
   "pass": true,
   "rationale": "Handles the compound event correctly: link loss as the in-flight anomaly, grounding as the post-flight decision, with measured confidence."
  }
 }
];
