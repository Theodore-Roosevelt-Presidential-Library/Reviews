/*!
 * Theodore Roosevelt Presidential Library — visitor quotes widget
 * Generated 2026-08-31 by collector/pullquotes.py. Do not edit site/embed.js by hand.
 *
 *   <div data-trpl-quotes data-layout="banner"></div>
 *   <script src="https://reviews.labs.trlibrary.com/embed.js" async></script>
 *
 * Options, all optional, set as data- attributes on the container:
 *   data-layout   banner | card | wall | inline      (default banner)
 *   data-theme    auto | light | dark                (default auto) — names the BACKGROUND:
 *                 "dark" = dark block, white text. If that reads backwards to you, use:
 *   data-text     white | dark                       — names the TEXT. Wins over data-theme.
 *   data-accent   any CSS colour                     (default TRPL red)
 *   data-count    how many to show in wall layout    (default 3)
 *   data-interval seconds between rotations, 0 = off (default 8)
 *   data-align    left | center                      (default center for banner)
 *   data-height   fixed | auto                       (default fixed — no layout shift)
 *   data-topic    outdoors | exhibits | families ... — lead with quotes about this subject.
 *                 Names come from config.json > pullquotes.topics, or use a raw theme name.
 *                 Ranks rather than filters, so a block never renders empty.
 *
 * Design notes worth keeping:
 *
 * Everything renders inside a shadow root. The host site is Drupal with Bootstrap, whose
 * global styles would otherwise reach in and restyle a blockquote; nothing here inherits
 * except the font stack and the resolved text colour, both deliberately.
 *
 * The widget reads its own computed background and picks light or dark text from the
 * luminance it finds. "Any colour block including white" means the block can't assume one.
 * Transparent backgrounds walk up the tree until something opaque is found.
 *
 * Rotation stops when the widget is off screen, when the tab is hidden, when a pointer is
 * over it, and when the visitor has asked for reduced motion. A quote block that keeps
 * animating behind a scrolled-past viewport is wasted battery and, for some readers,
 * genuinely unpleasant.
 */
(function () {
  "use strict";

  var QUOTES = [{"quote":"We kicked our day off with a guided highlights tour pre-booked. It was a perfect lay of the landscape overview for the intensive, immersive Museum experience.","draw":"guided tour value","author":"IowaTraveler925","source":"tripadvisor","date":"2026-08-31","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1075692432-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["guided_tours","interpretation","dwell_time"]},{"quote":"The views on the outside were great, and the exhibits on the inside were fun, interactive and very informative.","draw":"the badlands view","author":"lynne S.","source":"google","date":"2026-08-31","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25sMVYzaE5kMWhGVkRJeWVrc3pTbkZEWjFwZlJHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnl1V3hNd1hFVDIyekszSnFDZ1pfRGc%7C%7C?hl=en","themes":["interactive_exhibits","landscape"]},{"quote":"State of the art interactivity that makes history fun for the entire family","draw":"kids stayed engaged","author":"Andrew B.","source":"google","date":"2026-08-30","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xwUlV6WnZZMlF0V0d0eU5qZHZVWEZsVXpKbWFIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlpRUzZvY2QtWGtyNjdvUXFlUzJmaHc%7C%7C?hl=en","themes":["interactive_exhibits","families"]},{"quote":"Great use of interactive technology.  Nice set up of exhibits as you wind through them and the activities.","draw":"interactive exhibits","author":"Josh H.","source":"google","date":"2026-08-29","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21adlEySm5VRXhGWlU1eGNUWlNPRTluVmpsSU0xRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmZvQ2JnUExFZU5xcTZSOE9nVjlIM1E%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Awesome interactive displays to keep the younger ones interested.","draw":"kids stayed engaged","author":"Scott T.","source":"google","date":"2026-08-29","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21KbmFYcFlXR3B6Ym1SeE5HZG1UV1pYVmtkc2VGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmJnaXpYWGpzbmRxNGdmTWZXVkdseFE%7C%7C?hl=en","themes":["interactive_exhibits","families"]},{"quote":"We were able to sit in the Oval Office and ask President Roosevelt questions.","draw":"interactive_exhibits","author":"LauraWfromMS","source":"tripadvisor","date":"2026-08-28","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1075258229-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits"]},{"quote":"The outside of the library is unlike anything I have seen before. The roof is completely covered with landscape.","draw":"architecture","author":"Michelle R.","source":"google","date":"2026-08-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2kwMVJrY3djVGRZZUc5MGJuWlZTRVI0TkdOcFVHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOi01RkcwcTdYeG90bnZVSER4NGNpUGc%7C%7C?hl=en","themes":["architecture"]},{"quote":"Countless displays to read and see. We spent 4 hours and could have spent more and if you like history it’s a fantastic experience.","draw":"dwell time","author":"J U.","source":"google","date":"2026-08-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pkaUxVeEJSM05zWDNjeVlsQnJRMjl4UVRSM1dtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjdiLUxBR3NsX3cyYlBrQ29xQTR3Wmc%7C%7C?hl=en","themes":["dwell_time"]},{"quote":"The interactive wrist bands make the museum come to life with AI blended photographs.","draw":"interactive exhibits","author":"Brian R.","source":"google","date":"2026-08-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pCa1lXTk9MVFo2UjBKSFV6SmxUM05tYkdZeVIzYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjBkYWNOLTZ6R0JHUzJlT3NmbGYyR3c%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Great for all ages! There was something for everyone to explore.","draw":"kids stayed engaged","author":"doug M.","source":"google","date":"2026-08-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21KUk1GQndia055Vm14aldYSkxORE5yZGtoM2QyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmJRMFBwbkNyVmxjWXJLNDNrdkh3d2c%7C%7C?hl=en","themes":["families"]},{"quote":"The outdoor boardwalk and roof offer stunning panoramic views of the surrounding badlands, with plenty of seating and even porch swings to relax and enjoy the views.","draw":"rooftop","author":"Chris A.","source":"google","date":"2026-08-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2podU9WZEllRmx3VVVKcFVXUkNXa2M1YUhkcU1HYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjhuOVdIeFlwUUJpUWRCWkc5aHdqMGc%7C%7C?hl=en","themes":["rooftop","boardwalk_trails"]},{"quote":"President's life presented in a visual format that could be understood by any age.","draw":"age tiers","author":"Dwight S.","source":"google","date":"2026-08-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2taUGIyOTVZamM1VFZWclZEUnBiUzF0TjE5YVVrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkZPb295Yjc5TVVrVDRpbS1tN19aUkE%7C%7C?hl=en","themes":["age_tiers"]},{"quote":"As someone who has read a bit about Theodore Roosevelt‘s life, this museum creates an immersive experience, mixing artifacts from his life to AI that brings life to what otherwise could be just another museum experience.","draw":"immersive experience","author":"Jim","source":"google","date":"2026-08-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xCSVIyaEVXbGR1UXpSNVFVSkVjVzgzZW1WU1VIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlBIR2hEWlduQzR5QUJEcW83emVSUHc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Beautiful place that has been very thoughtful created. Engaging for every age group and inclusive.","draw":"engaging for all ages","author":"Lauren S.","source":"google","date":"2026-08-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25CUldGQkZVRU51WjBaTFJtNVhNamg2WjJWUldrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnBRWFBFUENuZ0ZLRm5XMjh6Z2VRWkE%7C%7C?hl=en","themes":["families"]},{"quote":"The interactive wristbands created a sense of participation in the exhibits, very well laid out, easy to navigate, engaging content.","draw":"interactive exhibits","author":"kaden C.","source":"google","date":"2026-08-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2poMU4wcE9jSEJoTFhkUlJ6WlNWMlJTWTBJeWQxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjh1N0pOcHBhLXdRRzZSV2RSY0Iyd1E%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"We have gone twice now and we have a different experience each time. There is so much to see and explore.","draw":"dwell time","author":"Sarah T.","source":"google","date":"2026-08-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21GdVkyNWhZVEEyT1ZsRkxXNUdhVXN4ZHpCRlMwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmFuY25hYTA2OVlFLW5GaUsxdzBFS0E%7C%7C?hl=en","themes":["dwell_time"]},{"quote":"More impressive than any pres. library or museum I've ever visited. Spent 5.5 hours and still didn't see everything.","draw":"dwell time","author":"Traveling T.","source":"google","date":"2026-08-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pCUFIzWnBPVmhLTFdwU1MwZDFlbTl0V1ZadWMyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjBPR3ZpOVhKLWpSS0d1em9tWVZuc2c%7C%7C?hl=en","themes":["dwell_time"]},{"quote":"I found it especially interesting to speak directly to Theodore Roosevelt in his office as an AI and I did ask him several questions.","draw":"interactive ai exhibit","author":"Lori B.","source":"google","date":"2026-08-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21WdVNXUkVSMmRyWVZsUk5FbzFVbFp0ZGxsWGNuYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmVuSWRER2drYVlRNEo1UlZtdllXcnc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"The live rooftop offers and nice walking trail with views of the beautiful surrounding terrain.","draw":"rooftop","author":"Amy B.","source":"google","date":"2026-08-24","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21GNVVIaERTSHBCTW5sWVlVZFJVbmhwT1VoUFgzYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmF5UHhDSHpBMnlYYUdRUnhpOUhPX3c%7C%7C?hl=en","themes":["rooftop","boardwalk_trails","landscape"]},{"quote":"An incredible collection of history, interesting interactive displays, & a beautiful tribute to a thoughtful man and the natural landscape in which he found some peace.","draw":"the badlands view","author":"Kassandra K.","source":"google","date":"2026-08-22","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pjMmVITlJSWHA2YlhKaU1UZExlVlZKVjB0R1prRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjc2eHNRRXp6bXJiMTdLeVVJV0tGZkE%7C%7C?hl=en","themes":["interactive_exhibits","landscape"]},{"quote":"You will also get to ask Teddy live questions and he answers…. Just unbelievable!","draw":"interactive ai exhibit","author":"gramma M.","source":"tripadvisor","date":"2026-08-22","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1074366860-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits"]},{"quote":"Extremely well done, very accessible, informative and fun Presidential library.","draw":"worth the drive","author":"Chip G.","source":"google","date":"2026-08-21","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25WZloyWlNibDlOVlVkbWJGTnJRVFpZVTA0ME0xRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnVfZ2ZSbl9NVUdmbFNrQTZYU040M1E%7C%7C?hl=en","themes":["accessibility"]},{"quote":"Fantastic museum. The way it's laid out is the best and you can actually touch things.","draw":"hands on exhibits","author":"Kelly R.","source":"google","date":"2026-08-21","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xaRFMwc3pZM015YXpnMWRrVm5VMUl0T1VKT1JWRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlZDS0szY3Myazg1dkVnU1ItOUJORVE%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Very well laid out with the exhibit halls laid out by eras in his life.","draw":"worth the drive","author":"Peter H.","source":"google","date":"2026-08-20","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xWTWJYa3hhbU5rYkhKdWFEaGFkemxLWVVOaU1uYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlVMbXkxamNkbHJuaDhadzlKYUNiMnc%7C%7C?hl=en","themes":["interpretation"]},{"quote":"You get to talk to an AI Teddy Roosevelt, ask him questions, and then he will answer you.","draw":"interactive ai exhibit","author":"Charlotte T.","source":"google","date":"2026-08-20","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xkR2JEaDJNRzVPTURnelVqSkdSRzgxY2w5VVRIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOldGbDh2MG5OMDgzUjJGRG81cl9UTHc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Be sure and take the walk on the boardwalk outside and visit the roof.","draw":"boardwalk trails","author":"Kevin C.","source":"google","date":"2026-08-19","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kU1RWQkhYMEptZEhSc01tVmFiMVpXVUhwSVZIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOndSTVBHX0JmdHRsMmVab1ZWUHpIVHc%7C%7C?hl=en","themes":["boardwalk_trails","rooftop"]},{"quote":"I'm particularly impressed by the seamless and innovative use of technology.","draw":"innovative technology","author":"Mark M.","source":"google","date":"2026-08-13","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21Sd2RXWjZSVjh6ZVc1bmFVUkViRGwzZWtGdFIyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmRwdWZ6RV8zeW5naUREbDl3ekFtR2c%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"The flow of it and how it was broken down by each decade of his presidential journey was truly spectacular.","draw":"well organized exhibits","author":"Sarah","source":"google","date":"2026-08-13","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT214c00yNWhaVjlOWDJsM2JqVlBabWxUTm5WRlpGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmxsM25hZV9NX2l3bjVPZmlTNnVFZFE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"We had so much fun seeing wild horses 🐎  tons of bison 🦬 and of course the whimsical prairie dogs.","draw":"the badlands view","author":"World T.","source":"google","date":"2026-08-13","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2paRFQzaDBiaTFyU1RselJYUlpWVWRMVEVOMGJrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjZDT3h0bi1rSTlzRXRZVUdLTEN0bkE%7C%7C?hl=en","themes":["landscape"]},{"quote":"Many replicas are not displayed under glass  so you can touch them.","draw":"hands on exhibits","author":"panpanda","source":"tripadvisor","date":"2026-08-13","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1072978349-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits"]},{"quote":"Kudos to President Roosevelt for building a library that doesn't detract from the surroundings. In fact, this library is built into the surroundings.","draw":"architecture","author":"Kris B.","source":"google","date":"2026-08-12","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21aQlNrMDJUVWhpY0cwMVVqZENjRFp3TlhOaWVIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmZBSk02TUhicG01UjdCcDZwNXNieHc%7C%7C?hl=en","themes":["architecture","landscape"]},{"quote":"Each exhibit is educational and entertaining. Lots to see and take in. Very awe inspiring and showcased Roosevelt’s accomplishments and contributions to America’s greatness.","draw":"worth the drive","author":"SuburbanMomof2kids","source":"tripadvisor","date":"2026-08-10","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1072440638-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interpretation","dwell_time","drive_market"]},{"quote":"Wow, this is really well done and surpassed my expectations.","draw":"exceeded expectations","author":"Traci","source":"google","date":"2026-08-10","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT210WFFucEhPVTlaZUhwMFRtUXRkbGRSTTJveGJrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmtXQnpHOU9ZeHp0TmQtdldRM2oxbkE%7C%7C?hl=en","themes":[]},{"quote":"He was a great man and they did a great job telling the story of his life.","draw":"interpretation","author":"Russell W.","source":"google","date":"2026-08-10","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tsQ00zUTJaelpqVnpkVE0zZDBaMVZwVGxBeFRFRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOklCM3Q2ZzZjVzdTM3d0Z1VpTlAxTEE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"The interactive photo opportunities make this an over the top experience for all ages","draw":"interactive photo fun","author":"Terri M.","source":"google","date":"2026-08-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT214UkxVUnVjRU5qU0V4MmJqRldaakp4Vlc5SmEwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmxRLURucENjSEx2bjFWZjJxVW9Ja0E%7C%7C?hl=en","themes":["interactive_exhibits","families"]},{"quote":"They did a wonderful job making an interesting museum and library.","draw":"interesting museum","author":"Mark S.","source":"google","date":"2026-08-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2psRE1sSlNibXBJVFZkR1dEUkxiVlJyTkZGd2RYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjlDMlJSbmpITVdGWDRLbVRrNFFwdXc%7C%7C?hl=en","themes":["interpretation"]},{"quote":"There were things to do and see for all ages. Museum artifacts, interactive exhibits, scavenger hunts, replicas, rooms designed to immerse you in different eras of TR's life... there was just so much.","draw":"enough to fill a day","author":"Lakeisha H.","source":"google","date":"2026-08-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT20xWlFtSm1jSGRwZWtGMmFVRXlZVFkzTVZCcGVsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm1ZQmJmcHdpekF2aUEyYTY3MVBpelE%7C%7C?hl=en","themes":["interactive_exhibits","families","interpretation"]},{"quote":"Interactive exhibit, very informative and the interactive exhibits were a fun highlight","draw":"interactive_exhibits","author":"Sharon F.","source":"google","date":"2026-08-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2w4dFduVXlNWFpDUzFOUFlXVm9MVmhsUlZOTmMxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOl8tWnUyMXZCS1NPYWVoLVhlRVNNc1E%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"An absolutely amazing structure built into the North Dakota landscape.","draw":"architecture","author":"Jonathan M.","source":"google","date":"2026-08-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tWWlJFbzJiMHRwZUhWbE5EVmZiamxtWDB0dlVrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkVZREo2b0tpeHVlNDVfbjlmX0tvUkE%7C%7C?hl=en","themes":["architecture","landscape"]},{"quote":"Totally loved the location, the design, use of AI, and the interactive exhibits.","draw":"interactive_exhibits","author":"Brian H.","source":"google","date":"2026-08-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21wUVRsRmpMV3QxUVhSSFgxUlhabGRvTjJKWmVGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmpQTlFjLWt1QXRHX1RXZldoN2JZeFE%7C%7C?hl=en","themes":["interactive_exhibits","architecture"]},{"quote":"Beautiful views from the roof and cool looking architecture.","draw":"rooftop view","author":"Scott R.","source":"google","date":"2026-08-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kQlR6QlZZbVIwT1VvNWMyZERjbWRzTVU1bGRXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOndBTzBVYmR0OUo5c2dDcmdsMU5ldWc%7C%7C?hl=en","themes":["rooftop","architecture"]},{"quote":"Great used of historical artifacts and technology to tell the history of this great US president.","draw":"engaging exhibits","author":"William H.","source":"google","date":"2026-08-02","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xkbVoxSk9UMlo0T0U5cE4xaFpYMWcxT1ZjNE5sRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOldmZ1JOT2Z4OE9pN1hZX1g1OVc4NlE%7C%7C?hl=en","themes":["interpretation","interactive_exhibits"]},{"quote":"An exceptionally interactive and immersive educational experience housed in architecture that mirrors the surrounding beautiful landscape.","draw":"immersive exhibits","author":"Annika G.","source":"google","date":"2026-08-02","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tRNFUyTjBRbHB5VjJORWNXWmhSRmxSV2toSU9GRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkQ4U2N0QlpyV2NEcWZhRFlRWkhIOFE%7C%7C?hl=en","themes":["interactive_exhibits","architecture","landscape"]},{"quote":"It is an inspiring place for its architecture and high tech show.","draw":"architecture and tech","author":"Giorgio F.","source":"google","date":"2026-08-01","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pkWGJFODNTbGxxVFhka1VEUlFSalo0WkhkUGFXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjdXbE83SllqTXdkUDRQRjZ4ZHdPaWc%7C%7C?hl=en","themes":["architecture","interactive_exhibits"]},{"quote":"Recently opened on July 4 this year it is a beautiful display of architecture that meets nature and its surrounding area.","draw":"architecture meets nature","author":"Gayle B.","source":"google","date":"2026-08-01","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tWak1WTTNZbTlJUjI5UmMzbE5NVXhTTkZGd1JXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkVjMVM3Ym9IR29Rc3lNMUxSNFFwRWc%7C%7C?hl=en","themes":["architecture","landscape"]},{"quote":"Interactive displays get people of all ages and abilities involved.","draw":"all ages engaged","author":"Betty B.","source":"google","date":"2026-07-30","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25GeFlsQnVkWEJCZW5sYU5VbFlXRGRrYjNKa1dHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnFxYlBudXBBenlaNUlYWDdkb3JkWGc%7C%7C?hl=en","themes":["interactive_exhibits","age_tiers"]},{"quote":"The exhibits were so interactive and so much fun. The curators remembered that adults like to play and have fun too:).","draw":"fun for all ages","author":"Richard D.","source":"google","date":"2026-07-30","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kb05FaG9NM2xuVkdwalRuTmtRVkZWZGxGQmNIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOndoNEhoM3lnVGpjTnNkQVFVdlFBcHc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"The exhibits were informative and hands on.  The library is very interactive with fun AI engagement.  There is lots to explore so allow at least 3 hours there.","draw":"lots to explore","author":"Sleepyscags","source":"tripadvisor","date":"2026-07-30","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1070762696-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits","dwell_time"]},{"quote":"The really cool mini-theaters detailing TR's Rough Riders and Brazilian river expedition.","draw":"unique exhibits","author":"Vish B.","source":"google","date":"2026-07-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25SRlVHWmhUemhJWWxwSVRsWnlTelowVVhwRFJIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnRFUGZhTzhIYlpITlZySzZ0UXpDRHc%7C%7C?hl=en","themes":["interpretation"]},{"quote":"The building itself is absolutely beautiful, and it's worth to to learn also about the ways the library is generating its own sustainable energy, curbs carbon, loses no water, and aims for zero waste.","draw":"sustainable architecture","author":"M-A","source":"google","date":"2026-07-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tsc1JFNDVjMUpCWDNWUWJXZ3hkRlZQZDBWdVYxRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOklsRE45c1JBX3VQbWgxdFVPd0VuV1E%7C%7C?hl=en","themes":["architecture"]},{"quote":"The rooftop and boardwalk offer stunning views and the building is innovative.","draw":"rooftop","author":"Pam","source":"google","date":"2026-07-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2w5NFZubE9SbmhTTTFCU1ZEQTRSRE13UjJabVJVRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOl94VnlORnhSM1BSVDA4RDMwR2ZmRUE%7C%7C?hl=en","themes":["rooftop","boardwalk_trails","architecture"]},{"quote":"You get a good sense of the place and what it must have felt like to live here more than a century ago.","draw":"immersive experience","author":"Stewart K.","source":"google","date":"2026-07-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2taQ1RVdEdTSGx4ZGpCVlFWQjROMUJXY1ZSd2IwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkZCTUtGSHlxdjBVQVB4N1BWcVRwb0E%7C%7C?hl=en","themes":["interpretation","architecture","landscape"]},{"quote":"It’s immersive, interactive , inspiring , thoughtful . Many near tear moments listening to such inspiring words from an inspiring man.","draw":"immersive and inspiring","author":"Nicole A.","source":"google","date":"2026-07-23","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pGd2VtUjNTMG8xU21kbVNHTkhVWGN3YzJaS1VYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjFwemR3S0o1SmdmSGNHUXcwc2ZKUXc%7C%7C?hl=en","themes":["interactive_exhibits","interpretation"]},{"quote":"The Library is a Great addition to the presentation of US history and a statement that in effect explains TRs presence on Mt. Rushmore.","draw":"historical significance","author":"Lynn S.","source":"google","date":"2026-07-23","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pRNFpVUlRUblZZWDBKMFkyNDBNMk52Vm5Fd2EwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjQ4ZURTTnVYX0J0Y240M2NvVnEwa0E%7C%7C?hl=en","themes":["historical_balance"]},{"quote":"The displays are engaging, thought provoking, educational and fun.","draw":"engaging exhibits","author":"Susanna C.","source":"yelp","date":"2026-07-21","url":null,"themes":["interactive_exhibits","interpretation"]},{"quote":"Each exhibit is set up with interactive displays that make the experience incredibly immersive. You become part of the story itself.","draw":"immersive exhibits","author":"Crystal","source":"google","date":"2026-07-21","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21GMWFuRllXbGhxVHkxcE5WWnhkbWxRUVhaMVMyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmF1anFYWlhqTy1pNVZxdmlQQXZ1S2c%7C%7C?hl=en","themes":["interactive_exhibits","interpretation","accessibility","architecture"]},{"quote":"Wow! I’ve been a. Fan of Theodore Roosevelt for years, and this place did not disappoint. I left feeling inspired","draw":"inspiring experience","author":"Ira M.","source":"google","date":"2026-07-21","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pBNGRXNTNiVEpVUjJ3d2FXUTRORVoxTjJkTFlsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjA4dW53bTJUR2wwaWQ4NEZ1N2dLYlE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"The compass bracelets allow you to be immersed in the time period, hunt for animals along the way and more!","draw":"immersive experience","author":"Mrs A.","source":"google","date":"2026-07-20","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tkNVVsa3dUbmg2UlRWaVoySlZSM1Z5VEdkak1IYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkd5UlkwTnh6RTViZ2JVR3VyTGdjMHc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"The outside is amazing too, there is a boardwalk providing great views of the library and surroundings, not to mention a walkway on the roof.","draw":"boardwalk trails","author":"James B.","source":"google","date":"2026-07-20","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xWVFNucFlTV0poV0Y4emFGbGhhblpXZEhWVU5YYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlVTSnpYSWJhWF8zaFlhanZWdHVUNXc%7C%7C?hl=en","themes":["boardwalk_trails","rooftop","landscape"]},{"quote":"The scavenger hunt to find hidden animals and items throughout the museum was a fun add-on for people","draw":"interactive scavenger hunt","author":"Shelly B.","source":"google","date":"2026-07-20","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pCalFYbENjMDgzUVdaMFdsWlVRbXA1VkhCQ1NsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjBjQXlCc083QWZ0WlZUQmp5VHBCSlE%7C%7C?hl=en","themes":["interactive_exhibits"]}];
  var TOPICS = {"visit":["dwell_time","interactive_exhibits","families","peer_comparison","value_for_money"],"exhibits":["interactive_exhibits","interpretation","historical_balance","guided_tours"],"outdoors":["boardwalk_trails","landscape","rooftop","conservation_message"],"hiking":["boardwalk_trails","landscape","rooftop"],"biking":["boardwalk_trails","landscape"],"architecture":["architecture","landscape","rooftop"],"landscape":["landscape","conservation_message","boardwalk_trails"],"itineraries":["dwell_time","landscape","drive_market"],"planner":["dwell_time","families","value_for_money"],"families":["families","age_tiers","interactive_exhibits"],"groups":["families","age_tiers","guided_tours"],"tours":["guided_tours","interpretation"],"shopping":["retail","retail_pricing"],"eat":["food_beverage"],"directions":["drive_market","landscape"],"tickets":["value_for_money","timed_entry","dwell_time"],"membership":["value_for_money","dwell_time","peer_comparison"],"accessibility":["accessibility","staff"]};
  var GENERATED = "2026-08-31";
  if (!QUOTES.length) return;

  var BRAND = "#8B2E1F";
  var SOURCE_LABEL = { google: "Google", tripadvisor: "TripAdvisor",
                       yelp: "Yelp", facebook: "Facebook" };

  // ---------------------------------------------------------------- utilities

  function parseColor(value) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i.exec(value || "");
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }

  /**
   * What is actually behind this widget?
   *
   * Returns { color, media }. `media` means an ancestor is painted with an image, gradient
   * or video, so the colour is a guess and shouldn't be trusted.
   *
   * Reading background-color alone is what broke this on trlibrary.com. The homepage is
   * built from sections backed by photographs and a video banner; every one of them reports
   * background-color: rgba(0,0,0,0). The walk sailed past them to <body>, found white,
   * chose near-black text — and put it on a dark picture of the Badlands.
   */
  function backdrop(el) {
    var node = el, media = false;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      var cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") media = true;
      // A <video> or full-bleed <img> positioned behind the content is the same problem
      // wearing different markup — very common in Drupal hero sections.
      if (!media && node.querySelector) {
        var bleed = node.querySelector(":scope > video, :scope > img, :scope > picture");
        if (bleed) {
          var r = bleed.getBoundingClientRect(), n = node.getBoundingClientRect();
          if (r.width >= n.width * 0.9 && r.height >= n.height * 0.9) media = true;
        }
      }
      var c = parseColor(cs.backgroundColor);
      if (c && c.a > 0.1) return { color: c, media: media };
      node = node.parentElement;
    }
    return { color: { r: 255, g: 255, b: 255, a: 1 }, media: media };
  }

  /** WCAG relative luminance. Decides light text vs dark, nothing else. */
  function luminance(c) {
    var f = [c.r, c.g, c.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }

  function contrast(a, b) {
    var l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /**
   * An accent that survives the background it landed on.
   *
   * Light/dark alone isn't enough: the brand red is dark, so a dark block gets the clay
   * accent — but on the brand red block itself that clay sits at 3.5:1 against its own
   * parent and the stars nearly vanish. Anything that fails is dropped for the foreground
   * colour, which is guaranteed to read because it is what the quote is set in.
   */
  function pickAccent(requested, bg, fg) {
    var candidates = [requested, luminance(bg) < 0.45 ? "#E8927C" : BRAND, fg];
    for (var i = 0; i < candidates.length; i++) {
      if (!candidates[i]) continue;
      var probe = document.createElement("span");
      probe.style.color = candidates[i];
      document.body.appendChild(probe);
      var resolved = parseColor(getComputedStyle(probe).color);
      document.body.removeChild(probe);
      if (resolved && contrast(resolved, bg) >= 3) return candidates[i];
    }
    return fg;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /**
   * Order the pool for a page topic.
   *
   * A topic ranks, it never filters to nothing. The Shopping page has one quote mentioning
   * the store and the Eat page has two; hard filtering would leave those blocks empty or
   * showing a lone quote in a three-column grid, which looks broken rather than targeted.
   * On-topic quotes come first in random order, then everything else in random order, so a
   * page always fills and always leads with what it is about.
   *
   * data-topic takes one or more names from config.json > pullquotes.topics, or raw theme
   * names straight from data/themes.json if you want to be specific.
   */
  function rankForTopic(pool, topicAttr) {
    if (!topicAttr) return shuffle(pool);
    var wanted = {};
    topicAttr.toLowerCase().split(/[,\s]+/).filter(Boolean).forEach(function (name) {
      (TOPICS[name] || [name]).forEach(function (theme) { wanted[theme] = true; });
    });
    var on = [], off = [];
    pool.forEach(function (q) {
      var hit = (q.themes || []).some(function (t) { return wanted[t]; });
      (hit ? on : off).push(q);
    });
    return shuffle(on).concat(shuffle(off));
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ------------------------------------------------------------------ styles

  function styles(dark, ac, align, media) {
    // Plain white on dark, not the cream used elsewhere in the brand. Over a photograph the
    // cream reads as dirty; white reads as intentional.
    var fg = dark ? "#FFFFFF" : "#241C17";
    var muted = dark ? "rgba(255,255,255,.78)" : "rgba(36,28,23,.58)";
    var rule = dark ? "rgba(255,255,255,.28)" : "rgba(36,28,23,.14)";
    var chip = dark ? "rgba(255,255,255,.16)" : "rgba(36,28,23,.05)";
    // Stars get their own colour, not the accent. A rating reads as a rating when it is
    // gold — brand red on a red block was both invisible and unfamiliar. Deepened on light
    // backgrounds, where bright gold falls under 3:1 against white.
    var star = dark ? "#FFC24A" : "#B8860B";
    // Text on an image needs a halo or it dissolves wherever the picture works against it.
    // The halo has to follow the text colour, not merely the presence of an image: keying it
    // to `media` alone put a black glow behind near-black text whenever someone forced
    // data-theme="light" over a photo, which is precisely when they would — on a pale image.
    // Dark text gets a white halo, which is the same trick inverted.
    var shadow = !media ? "none"
      : dark ? "0 1px 12px rgba(0,0,0,.55),0 1px 3px rgba(0,0,0,.45)"
             : "0 1px 10px rgba(255,255,255,.9),0 1px 3px rgba(255,255,255,.75)";
    return [
      ':host{all:initial;display:block;contain:content}',
      '*{box-sizing:border-box;margin:0;padding:0}',
      '.w{font-family:"Source Serif 4",Georgia,"Times New Roman",serif;color:' + fg + ';',
      '  text-align:' + (align === "left" ? "left" : "center") + ';line-height:1.5;',
      '  text-shadow:' + shadow + '}',
      '.w.l-wall,.w.l-inline{text-align:left}',
      'blockquote{font-size:clamp(1.15rem,2.4vw,1.6rem);font-weight:400;letter-spacing:-.01em;',
      '  quotes:none;position:relative}',
      '.l-banner blockquote{max-width:44ch;margin:0 auto}',
      '.l-banner.a-left blockquote{margin:0}',
      // Lighter backgrounds can carry a faint mark; on dark it disappears at .4.
      '.mark{display:block;font-size:2.6em;line-height:.6;color:' + ac + ';',
      '  opacity:' + (dark ? '.75' : '.4') + ';',
      '  margin-bottom:.16em;font-family:Georgia,serif}',
      '.cite{margin-top:1rem;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",',
      '  Helvetica,Arial,sans-serif;font-size:.8125rem;font-style:normal;color:' + muted + ';',
      '  display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;',
      '  justify-content:' + (align === "left" ? "flex-start" : "center") + '}',
      '.l-wall .cite,.l-inline .cite{justify-content:flex-start}',
      '.who{font-weight:600;color:' + fg + '}',
      '.stars{color:' + star + ';letter-spacing:.09em;font-size:.8125rem;text-shadow:none}',
      '.via{padding:.1rem .4rem;border-radius:3px;background:' + chip + ';font-size:.6875rem;',
      '  letter-spacing:.03em;text-transform:uppercase;text-shadow:none}',
      // Rotation is a cross-fade with a small lift. Both are suppressed under
      // prefers-reduced-motion, where the quote simply changes.
      // Measured off-screen at the real width, with the real styles, so the number it
      // yields is the height the quote will actually occupy. visibility:hidden rather than
      // display:none — a display:none element has no layout and measures zero.
      '.probe{position:absolute;left:0;top:0;width:100%;visibility:hidden;',
      '  pointer-events:none;z-index:-1}',
      '.stage-host{position:relative}',
      // Centred in the reserved box, not pinned to its top. Reserving the tallest quote's
      // height means a short one would otherwise sit high with a hole beneath it, which
      // looks like a rendering fault rather than a deliberate space.
      '.slide{opacity:1;transform:translateY(0);transition:opacity .5s ease,transform .5s ease;',
      '  display:flex;flex-direction:column;justify-content:center}',
      '.slide.out{opacity:0;transform:translateY(-6px)}',
      '@media (prefers-reduced-motion:reduce){.slide{transition:none}}',
      // wall
      '.grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}',
      '.grid blockquote{font-size:1rem;line-height:1.6;padding:1.15rem 1.25rem;',
      '  border:1px solid ' + rule + ';border-radius:6px;height:100%}',
      '.grid .mark{font-size:1.8em}',
      '.grid .cite{margin-top:.75rem;font-size:.75rem}',
      // inline
      '.l-inline blockquote{font-size:1rem;line-height:1.65;padding-left:1rem;',
      '  border-left:3px solid ' + ac + '}',
      '.l-inline .mark{display:none}',
      // card
      '.l-card .box{padding:1.6rem 1.75rem;border:1px solid ' + rule + ';border-radius:8px;',
      '  background:' + (dark ? "rgba(247,243,236,.04)" : "rgba(255,255,255,.55)") + '}',
      '.l-card blockquote{font-size:1.1rem;line-height:1.6}',
      // controls
      '.dots{display:flex;gap:.4rem;margin-top:1.1rem;',
      '  justify-content:' + (align === "left" ? "flex-start" : "center") + '}',
      '.dot{width:6px;height:6px;border-radius:50%;border:0;padding:0;cursor:pointer;',
      '  background:' + rule + ';transition:background .2s,width .2s}',
      '.dot[aria-current="true"]{background:' + ac + ';width:18px;border-radius:3px}',
      '.dot:focus-visible{outline:2px solid ' + ac + ';outline-offset:3px}',
      // Over a photograph this line sat at .75 opacity on a busy background and vanished.
      // Full strength and the shared shadow when there is an image behind it.
      '.foot{margin-top:1rem;font-family:Inter,system-ui,sans-serif;font-size:.625rem;',
      '  letter-spacing:.04em;text-transform:uppercase;color:' + muted + ';',
      '  opacity:' + (media ? "1" : ".75") + '}',
      '.foot a{color:inherit;text-underline-offset:2px}'
    ].join("");
  }

  // ------------------------------------------------------------------ render

  function stars(n) { return n ? "★★★★★".slice(0, n) : ""; }

  function quoteHtml(q, opts) {
    var via = SOURCE_LABEL[q.source] || q.source;
    // Marks a fragment as a fragment. Adds no words, changes none — the quote is still
    // exactly what the visitor typed, it just stops looking like a complete sentence that
    // someone forgot to punctuate.
    var text = q.quote + (/[.!?…"'’”]$/.test(q.quote) ? "" : "…");
    return '<blockquote><span class="mark" aria-hidden="true">“</span>' +
      esc(text) +
      '<footer class="cite"><span class="who">' + esc(q.author) + '</span>' +
      (opts.showStars !== false ? '<span class="stars" aria-label="5 out of 5 stars">' +
        stars(q.rating || 5) + '</span>' : '') +
      '<span class="via">' + esc(via) + '</span></footer></blockquote>';
  }

  /**
   * Reserve the height of the tallest quote so rotation never moves the page.
   *
   * Quotes vary from one line to five. Left alone the block resizes every eight seconds and
   * shoves everything below it up and down — the worst kind of layout shift, because it
   * happens while someone is reading further down the page rather than only at load.
   *
   * Measured rather than guessed: a character-count estimate breaks the moment the font,
   * the column width or the viewport changes. This renders every quote into a hidden probe
   * that sits inside the same container and inherits the same rules, takes the largest
   * height, and pins the stage to it.
   */
  function reserveHeight(container, stage, pool) {
    var probe = document.createElement("div");
    probe.className = "probe";
    container.appendChild(probe);
    var tallest = 0;
    for (var n = 0; n < pool.length; n++) {
      probe.innerHTML = quoteHtml(pool[n], {});
      tallest = Math.max(tallest, probe.getBoundingClientRect().height);
    }
    container.removeChild(probe);
    if (tallest > 0) stage.style.minHeight = Math.ceil(tallest) + "px";
  }

  /** Re-measure when the width changes or a webfont finally lands. */
  function keepReserved(host, container, stage, pool) {
    var pending = null;
    function remeasure() {
      clearTimeout(pending);
      pending = setTimeout(function () {
        stage.style.minHeight = "";      // release before measuring, or it only ever grows
        reserveHeight(container, stage, pool);
      }, 120);
    }
    reserveHeight(container, stage, pool);

    // Source Serif 4 arrives after first paint. Measuring in the fallback font gives the
    // wrong answer and the reserved box ends up short by a line on narrow screens.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(remeasure).catch(function () {});
    }
    if (window.ResizeObserver) {
      var first = true;
      new ResizeObserver(function () {
        if (first) { first = false; return; }   // the observer fires once on attach
        remeasure();
      }).observe(host);
    } else {
      window.addEventListener("resize", remeasure);
    }
  }

  function mount(host) {
    var layout = (host.getAttribute("data-layout") || "banner").toLowerCase();
    // data-theme names the BACKGROUND: "dark" means a dark block, therefore white text.
    // That reads backwards to most people — it was set to "light" on trlibrary.com by
    // someone who wanted light-coloured text and got near-black on a dark section. So
    // data-text is accepted as an unambiguous alias and wins when both are present:
    // data-text="white" says what you actually want to see.
    var themeAttr = (host.getAttribute("data-theme") || "auto").toLowerCase();
    var textAttr = (host.getAttribute("data-text") || "").toLowerCase();
    if (textAttr) {
      themeAttr = /^(white|light)$/.test(textAttr) ? "dark"
                : /^(black|dark|ink)$/.test(textAttr) ? "light" : themeAttr;
    }
    // Spell it out the other way too, for anyone who finds these clearer.
    if (themeAttr === "on-dark") themeAttr = "dark";
    if (themeAttr === "on-light") themeAttr = "light";
    var accent = host.getAttribute("data-accent") || "";
    var align = (host.getAttribute("data-align") || "").toLowerCase();
    var count = Math.max(1, parseInt(host.getAttribute("data-count") || "3", 10));
    var interval = host.hasAttribute("data-interval")
      ? parseFloat(host.getAttribute("data-interval")) * 1000 : 8000;

    var back = backdrop(host);
    var bg = back.color;
    var dark = themeAttr === "dark";
    if (themeAttr === "auto") {
      // Over a photograph or video the measured colour means nothing. Light text with a
      // soft shadow is the safe read on almost any image; dark text on an unknown picture
      // is a coin flip, and this one landed wrong on the Library's own homepage.
      dark = back.media ? true : luminance(bg) < 0.45;
    }
    if (back.media && dark) bg = { r: 40, g: 36, b: 32, a: 1 };  // assume a dark-ish image

    // When the caller forces a theme, the measured background is no longer the one the text
    // is designed against — so the accent must not be picked against it either. On
    // trlibrary.com the homepage section paints no background at any level, so the widget
    // measured white, chose brand red as a perfectly good accent for white, and then set the
    // text to white because data-theme="dark" said so. Result: a red quote mark at 40%
    // opacity on dark blue. Text colour followed the override; the accent didn't.
    if (themeAttr !== "auto" && (luminance(bg) < 0.45) !== dark) {
      bg = dark ? { r: 26, g: 32, b: 48, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    }

    var ac = pickAccent(accent, bg, dark ? "#FFFFFF" : "#241C17");

    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var pool = rankForTopic(QUOTES, host.getAttribute("data-topic"));

    var sheet = document.createElement("style");
    sheet.textContent = styles(dark, ac, align, back.media);
    root.appendChild(sheet);

    var wrap = document.createElement("div");
    wrap.className = "w l-" + layout + (align === "left" ? " a-left" : "");
    root.appendChild(wrap);

    // A wall shows several at once and does not rotate: motion in a grid is noise.
    if (layout === "wall") {
      wrap.innerHTML = '<div class="grid">' +
        pool.slice(0, count).map(function (q) { return quoteHtml(q, {}); }).join("") +
        "</div>" + footer();
      return;
    }

    var i = 0;
    var stage = document.createElement("div");
    stage.className = "slide";
    // The probe has to be measured inside whatever box constrains the real quote, or a
    // padded card measures at the wrong width and reserves too little.
    var container = wrap;
    if (layout === "card") {
      var box = document.createElement("div");
      box.className = "box stage-host";
      box.appendChild(stage);
      wrap.appendChild(box);
      container = box;
    } else {
      wrap.classList.add("stage-host");
      wrap.appendChild(stage);
    }

    var dots = null;
    if (pool.length > 1 && interval > 0) {
      dots = document.createElement("div");
      dots.className = "dots";
      dots.setAttribute("role", "tablist");
      dots.setAttribute("aria-label", "Choose a visitor quote");
      pool.slice(0, Math.min(pool.length, 6)).forEach(function (_, n) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "dot";
        b.setAttribute("aria-label", "Quote " + (n + 1));
        b.onclick = function () { show(n, true); };
        dots.appendChild(b);
      });
      wrap.appendChild(dots);
    }
    wrap.insertAdjacentHTML("beforeend", footer());

    // The quote is not an alert; a screen reader should find it on its own terms rather
    // than have every rotation announced over whatever the visitor is reading.
    stage.setAttribute("aria-live", "off");
    stage.setAttribute("role", "region");
    stage.setAttribute("aria-label", "What visitors say");

    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paint(n) {
      stage.innerHTML = quoteHtml(pool[n], {});
      if (dots) {
        Array.prototype.forEach.call(dots.children, function (d, k) {
          d.setAttribute("aria-current", k === n % dots.children.length ? "true" : "false");
        });
      }
    }

    function show(n, manual) {
      i = (n + pool.length) % pool.length;
      if (reduce) { paint(i); }
      else {
        stage.classList.add("out");
        setTimeout(function () { paint(i); stage.classList.remove("out"); }, 320);
      }
      if (manual) restart();
    }

    var timer = null;
    function restart() {
      clearInterval(timer);
      if (interval > 0 && pool.length > 1) {
        timer = setInterval(function () { show(i + 1); }, interval);
      }
    }
    function stop() { clearInterval(timer); timer = null; }

    paint(0);
    if (dots) dots.children[0].setAttribute("aria-current", "true");

    // Opt out with data-height="auto" if a block genuinely wants to hug its content.
    if ((host.getAttribute("data-height") || "fixed").toLowerCase() !== "auto") {
      keepReserved(host, container, stage, pool);
    }
    restart();

    host.addEventListener("mouseenter", stop);
    host.addEventListener("focusin", stop);
    host.addEventListener("mouseleave", restart);
    host.addEventListener("focusout", restart);
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : restart();
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? restart() : stop();
      }, { threshold: 0.05 }).observe(host);
    }
  }

  // One quiet line. The generated date lives in the tooltip, not on the page: a visible
  // date on a marketing block reads as a system artifact, and goes stale visibly if the
  // pipeline ever stops.
  function footer() {
    return '<div class="foot" title="Updated ' + esc(GENERATED) + '">' +
      'Excerpts from verified visitor reviews</div>';
  }

  function init() {
    var hosts = document.querySelectorAll("[data-trpl-quotes]:not([data-trpl-ready])");
    Array.prototype.forEach.call(hosts, function (h) {
      h.setAttribute("data-trpl-ready", "1");
      try { mount(h); } catch (e) { /* never take the page down over a quote block */ }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  // Exposed so the preview page can show which page topics actually have material behind
  // them. A topic with nothing on it still renders — it just isn't targeted, and whoever is
  // placing the embed deserves to know that before they put it on a page.
  window.TRPLQuotes = {
    refresh: init,
    count: QUOTES.length,
    topics: TOPICS,
    coverage: function () {
      var out = {};
      Object.keys(TOPICS).forEach(function (name) {
        var want = {};
        TOPICS[name].forEach(function (t) { want[t] = true; });
        out[name] = QUOTES.filter(function (q) {
          return (q.themes || []).some(function (t) { return want[t]; });
        }).length;
      });
      return out;
    }
  };
})();
