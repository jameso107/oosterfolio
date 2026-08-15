// Pre-computed narrative layer output for every flight (demo mode).
// Generated ahead of time by Claude (the same model live mode calls), from the same
// prompt template the live mode uses: deterministic flags in, plain-language narrative out.
// The model repeats provided numbers; it never computes them.
// Categories: nominal | planned-deviation | operational-incident | navigation-anomaly |
//             communications-loss | early-termination
window.TRIAGE_CACHED = {
 "1": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "Duration sits well below the fleet envelope, but this was the first powered flight on another planet: a short vertical hover with a planned 96 degree rotation and essentially zero traverse. The deviation is the mission profile, not a fault."
 },
 "2": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "A short early test flight with a small sideways translation and return. All metrics are inside the fleet envelope and the record describes the maneuver executing as planned."
 },
 "3": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "First flight to venture downrange, a 50 meter out and back at 2 m/s. Every metric is inside the fleet envelope and the record reports a clean landing at the departure spot."
 },
 "4": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "The first attempt at this flight failed before takeoff: onboard software did not transition to flight mode. The reflight completed a normal traverse with all metrics inside the envelope, so the incident is confined to the pre-flight sequence."
 },
 "5": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "One way trip to a new airfield, the first landing away from the deployment site. Metrics are inside the fleet envelope and the record reports no issues."
 },
 "6": {
  "category": "navigation-anomaly",
  "confidence": "high",
  "narrative": "All four metrics look ordinary, which is exactly why the record note matters: 54 seconds in, the navigation image pipeline dropped a frame and subsequent images carried incorrect timestamps, producing oscillations and a tilting excursion the vehicle recovered from. This is an in-flight navigation anomaly the envelope statistics cannot see."
 },
 "7": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "The first attempt failed before takeoff when the software did not transition to flight mode. The reflight was flown with the color camera disabled to avoid a repeat of flight 6's image pipeline glitch, and completed inside the fleet envelope."
 },
 "8": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse to a new airfield. All metrics are inside the fleet envelope and the public record notes nothing unusual."
 },
 "9": {
  "category": "nominal",
  "confidence": "medium",
  "narrative": "A long, deliberately ambitious crossing of the Seitah dunes that strained the navigation system, which assumes flat ground. Controllers pre-compensated by slowing the vehicle over the roughest stretch and the flight completed with all metrics inside the envelope. Nominal outcome, but a flight worth reading in full."
 },
 "10": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Multi-waypoint survey flight. All metrics sit inside the fleet envelope and the record reports the plan executing normally."
 },
 "11": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Repositioning flight in support of rover operations. Metrics are inside the fleet envelope with no anomalies in the record."
 },
 "12": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Stereo imaging run over Seitah with an offset return path for paired images. All metrics are inside the fleet envelope and the record describes the flight as decisive for the rover's route planning. No anomalies."
 },
 "13": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Low imaging pass over Seitah terrain. Metrics inside the envelope, nothing unusual in the record."
 },
 "14": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "The first attempt was automatically canceled by a servo motor anomaly during pre-flight checks. The reflight was a deliberately brief hop to verify the faster 2700 rpm rotor setting needed for the thinner seasonal atmosphere, which explains the very short duration flag. The defining event is the pre-flight servo abort."
 },
 "15": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Start of the multi-flight return toward Wright Brothers Field. Metrics inside the fleet envelope, record clean."
 },
 "16": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Short leg of the return journey. All metrics inside the fleet envelope with no anomalies noted."
 },
 "17": {
  "category": "communications-loss",
  "confidence": "high",
  "narrative": "The metrics are unremarkable, but the vehicle lost its radio link to the rover during final descent, roughly 3 meters above the ground, with a rock outcrop blocking line of sight. JPL judged the flight successful from the data received, and the link was later restored. In-flight communications loss during the landing phase."
 },
 "18": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Continuation of the return traverse at reduced speed as a precaution after flight 17's link loss. Metrics inside the envelope, no new anomalies."
 },
 "19": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "The first attempt was postponed by an approaching dust storm, the first weather delay for an aircraft on another planet. Once flown, the climb out of South Seitah completed with all metrics inside the envelope. The event of record is the pre-flight weather hold."
 },
 "20": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Return leg toward Wright Brothers Field. Metrics inside the fleet envelope, record clean."
 },
 "21": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Traverse toward the river delta campaign. All metrics inside the fleet envelope with nothing unusual in the record."
 },
 "22": {
  "category": "early-termination",
  "confidence": "medium",
  "narrative": "The record states the vehicle flew only 70.4 meters of a planned roughly 350 meter leg, so the flight ended far short of its plan even though every metric sits inside the fleet envelope. The public record does not state the cause, so confidence in the classification is moderate: treat this as an early termination pending more detail."
 },
 "23": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Delta approach leg. Metrics inside the fleet envelope, no anomalies noted in the record."
 },
 "24": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Short repositioning hop in the delta campaign. All metrics inside the envelope, record clean."
 },
 "25": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "The longest traverse of the mission at just over 700 meters, still inside the fleet envelope at the 2.5 sigma threshold. A record setting distance flown as planned, with no anomalies in the record."
 },
 "26": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Imaging flight in the delta campaign. Metrics inside the fleet envelope, nothing unusual reported."
 },
 "27": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Short scouting hop. All metrics inside the fleet envelope, record clean."
 },
 "28": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Traverse supporting the rover's delta approach. Metrics inside the envelope, no anomalies noted."
 },
 "29": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Flown after rotor spin health checks noted in the record, this repositioning flight completed with all metrics inside the fleet envelope. The spin tests were routine checkouts rather than incidents."
 },
 "30": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "First flight after the dust season and a two month stand down, deliberately flown as a short hop to confirm the vehicle could still hit a target after inactivity. The short duration flag reflects that checkout profile, preceded by planned rotor spin health checks. Expected deviation, not a fault."
 },
 "31": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Short repositioning flight. Metrics inside the fleet envelope, record clean."
 },
 "32": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine hop in the delta campaign. All metrics inside the fleet envelope, nothing unusual reported."
 },
 "33": {
  "category": "nominal",
  "confidence": "medium",
  "narrative": "During this reposition, navigation camera footage showed a small piece of foreign object debris clinging to a landing leg for part of the flight; it was not present in later footage. The flight itself completed with all metrics inside the envelope. Worth a note in the log, but the record treats the debris as benign."
 },
 "34": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "An 18 second pop-up to exercise the fourth major software update, which added navigation capability for the steep delta terrain. The very short duration and near zero traverse flags describe a checkout profile that was the plan itself."
 },
 "35": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Repositioning flight during the delta campaign. Metrics inside the fleet envelope, record clean."
 },
 "36": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse. All metrics inside the fleet envelope with no anomalies in the record."
 },
 "37": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Short leg keeping pace with the rover. Metrics inside the envelope, nothing unusual noted."
 },
 "38": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "The first attempt was rejected before takeoff when onboard software did not transition to flight mode. The reflight completed normally with all metrics inside the fleet envelope, so the event of record is the pre-flight abort."
 },
 "39": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse in the delta campaign. Metrics inside the fleet envelope, record clean."
 },
 "40": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Scouting hop ahead of the rover. All metrics inside the fleet envelope, no anomalies reported."
 },
 "41": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Repositioning flight. Metrics inside the fleet envelope, nothing unusual in the record."
 },
 "42": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse. All metrics inside the fleet envelope, record clean."
 },
 "43": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Start of a series of frequent flights to stay ahead of the rover, whose no-fly exclusion zone prevents the two from passing in the canyon. Metrics inside the fleet envelope, no anomalies noted."
 },
 "44": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Canyon traverse keeping ahead of the rover. Metrics inside the fleet envelope, record clean."
 },
 "45": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine canyon leg. All metrics inside the fleet envelope with nothing unusual reported."
 },
 "46": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Scouting flight in the canyon campaign. Metrics inside the fleet envelope, no anomalies in the record."
 },
 "47": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Scouting flight photographing terrain ahead of the rover. Metrics inside the fleet envelope, record clean."
 },
 "48": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Imaging pass over an area of scientific interest. All metrics inside the fleet envelope, nothing unusual noted."
 },
 "49": {
  "category": "operational-incident",
  "confidence": "high",
  "narrative": "Two attempts were aborted before this flight flew: the first when high winds cooled the battery below pre-flight check levels, the second on a minor command sequencing glitch. The flight itself then scouted Belva Crater with metrics inside the fleet envelope. The defining events are the pre-flight aborts."
 },
 "50": {
  "category": "planned-deviation",
  "confidence": "medium",
  "narrative": "The altitude flag reflects a climb to 18 meters, above the fleet envelope, as the team expanded the flight envelope in rugged terrain. Context matters here: the preceding sols saw a terrain driven communications blackout with the rover, resolved when the rover came back into range before this flight. The altitude deviation itself reads as planned."
 },
 "51": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Scouting hop in the canyon campaign. Metrics inside the fleet envelope, record clean."
 },
 "52": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Traverse supporting the rover's route. All metrics inside the fleet envelope, no anomalies noted in the record."
 },
 "53": {
  "category": "early-termination",
  "confidence": "high",
  "narrative": "A low scouting flight cut short when the onboard LAND_NOW contingency program commanded an immediate landing before the planned climb to 10 meters. The metrics alone look like a modest flight; the record shows a protective automatic termination. The follow up investigation and flight 54 checkout confirm this as the event of record."
 },
 "54": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "A deliberate 24 second pop-up flown after the flight 53 investigation to test software modifications and confirm the cause of the autoland. The short duration flag is the diagnostic profile working as intended."
 },
 "55": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Traverse resuming the campaign after the flight 53 investigation. Metrics inside the fleet envelope, record clean."
 },
 "56": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine repositioning flight. All metrics inside the fleet envelope, nothing unusual reported."
 },
 "57": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse. Metrics inside the fleet envelope, no anomalies in the record."
 },
 "58": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine leg of the campaign. All metrics inside the fleet envelope, record clean."
 },
 "59": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "A pop-up to a record 20 meter altitude with near zero horizontal traverse, flown to characterize performance at height. The altitude flag is the point of the flight, not a fault."
 },
 "60": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Traverse flown within the expanded envelope. Metrics inside the fleet thresholds, nothing unusual noted."
 },
 "61": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "Envelope expansion pop-up to a record 24 meter altitude with near zero traverse. The altitude flag reflects the test objective itself."
 },
 "62": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "Envelope expansion run to a record 10 m/s groundspeed at 18 meters altitude, flagging both speed and altitude against the fleet envelope. Both deviations are the planned test profile."
 },
 "63": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Long traverse within the expanded envelope. Metrics inside the fleet thresholds, record clean."
 },
 "64": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse. All metrics inside the fleet envelope, no anomalies reported."
 },
 "65": {
  "category": "planned-deviation",
  "confidence": "medium",
  "narrative": "A short repositioning hop whose brief duration trips the envelope flag. The record describes a simple reposition, so the deviation reads as the intended profile rather than a fault."
 },
 "66": {
  "category": "planned-deviation",
  "confidence": "medium",
  "narrative": "Another brief reposition, again flagged only for short duration. The record gives no indication of a problem; the profile explains the statistics."
 },
 "67": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Flown after the solar conjunction pause, when Mars passes behind the Sun and communications are deliberately suspended. The reposition itself completed with all metrics inside the fleet envelope. The pause was planned, not an incident."
 },
 "68": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "Flight test at 10 m/s groundspeed, tripping the speed flag against the fleet envelope. The record describes an envelope expansion test, so the deviation is the objective."
 },
 "69": {
  "category": "planned-deviation",
  "confidence": "high",
  "narrative": "High speed flight test covering roughly 700 meters at 10 m/s, flagged on speed against the fleet envelope. A planned performance run near the vehicle's limits."
 },
 "70": {
  "category": "nominal",
  "confidence": "high",
  "narrative": "Routine traverse late in the mission. Metrics inside the fleet envelope, record clean."
 },
 "71": {
  "category": "early-termination",
  "confidence": "medium",
  "narrative": "The record states the planned flight was terminated early for technical reasons, and the short duration flag agrees. The public record does not identify the cause, so the classification is early termination with moderate confidence pending the flight 72 checkout."
 },
 "72": {
  "category": "communications-loss",
  "confidence": "medium",
  "narrative": "A brief system checkout after flight 71's early termination. The vehicle climbed to its assigned altitude, then lost communication with the rover about one meter above the surface during descent. Ingenuity was permanently grounded after this flight. The recorded in-flight event is the loss of link in the landing phase; the grounding decision followed from post-flight assessment."
 }
};
