/*!
 * Theodore Roosevelt Presidential Library — visitor quotes widget
 * Generated 2026-10-30 by collector/pullquotes.py. Do not edit site/embed.js by hand.
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

  var QUOTES = [{"quote":"So much information on TR. And we had fun with all the interactive parts.","draw":"interactive exhibits","author":"Debbie Z.","source":"google","date":"2026-10-29","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25CQmVUQnlNbkIwVW5sd1pXNXljMEpHVG01a1lsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnBBeTByMnB0UnlwZW5yc0JGTm5kYlE%7C%7C?hl=en-US","themes":["interactive_exhibits"]},{"quote":"Information was in depth and presented in a variety of creative formats.","draw":"creative presentation","author":"Lori N.","source":"google","date":"2026-10-29","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21aYU1tSkpVRlpxWjJnMGQxcGpOMVJmYjFGa1dHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmZaMmJJUFZqZ2g0d1pjN1Rfb1FkWGc%7C%7C?hl=en-US","themes":["interpretation"]},{"quote":"LOVED the architecture!!  Exhibits were plentiful and recommend planning to stay for several hours.","draw":"architecture","author":"Denise W.","source":"google","date":"2026-10-29","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xCSU9ISTRjUzE0YjB0dFUwd3RVVE0zT1dNMFUzYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlBIOHI4cS14b0ttU0wtUTM3OWM0U3c%7C%7C?hl=en-US","themes":["architecture","dwell_time"]},{"quote":"Simply a fantastic experience- educational, entertaining, and, above all, inspiring.","draw":"inspiring experience","author":"Tim M.","source":"google","date":"2026-10-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2paUlJUTmxkVzVsYkRKS01tTnJhV0ZCTVVaVVVFRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjZRRTNldW5lbDJKMmNraWFBMUZUUEE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"My favorite spot in the museum was visiting Teddy in his office and asking him questions!","draw":"interactive_exhibits","author":"MNSDMOSD","source":"tripadvisor","date":"2026-10-28","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1083506539-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits"]},{"quote":"Kids and adults had so much fun. We could have spent another 2 hours there if we wanted!","draw":"kids stayed engaged","author":"Scott W.","source":"google","date":"2026-10-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21KUVNFOVpjblZmTUVkRFFtcFFiMVZzZDBsMGRYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmJQSE9ZcnVfMEdDQmpQb1Vsd0l0dXc%7C%7C?hl=en-US","themes":["families","dwell_time"]},{"quote":"It's amazing what technology, properly used, can do to enhance the experience.","draw":"interactive exhibits","author":"Eileen B.","source":"google","date":"2026-10-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2kxTlFXWjNXWGs0UkdGR0xWODVibmN5TlMxNGNHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOi1NQWZ3WXk4RGFGLV85bncyNS14cGc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Very interactive for adults and kids. The architecture is amazing and the views can’t be matched.","draw":"kids stayed engaged","author":"Kathy W.","source":"tripadvisor","date":"2026-10-27","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1083347384-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits","architecture","rooftop"]},{"quote":"I loved how interactive it was and the scenery put it even more over the top.","draw":"kids stayed engaged","author":"Belinda P.","source":"yelp","date":"2026-10-26","url":"https://www.yelp.com/biz/theodore-roosevelt-presidential-library-medora-2?hrid=TfrQ1NuLbc0AWPyMbTaDDQ","themes":["interactive_exhibits","landscape"]},{"quote":"My favorite exhibit, which was a film, was of his trip down the Amazon.","draw":"named exhibit","author":"Kathleen P.","source":"google","date":"2026-10-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT205d1VEbFhTM2hsVEhwaVJWbG1ibGx1VUhWak5sRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm9wUDlXS3hlTHpiRVlmblluUHVjNlE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"The TR library is so interesting with lots of history to learn about TR.","draw":"lots to learn","author":"Marlys R.","source":"google","date":"2026-10-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21sT09VWkpjRFpWVDNCa1RYaDBiek4yZUUxNE9VRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmlOOUZJcDZVT3BkTXh0bzN2eE14OUE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"Such a beautiful building! The attention to detail was impressive.","draw":"architecture","author":"Sara","source":"google","date":"2026-10-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21zd1ZHVllXSGxOWkRGQmNERkVWMDFKYUVsRWMyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmswVGVYWHlNZDFBcDFEV01JaElEc2c%7C%7C?hl=en","themes":["architecture"]},{"quote":"A lot of interactive fun with American history in a beautiful facility.","draw":"interactive exhibits","author":"Jay S.","source":"google","date":"2026-10-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25wWmFVNTJjVk0yYjNWaVUycEhNa2R6YTBGZlRuYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnpZaU52cVM2b3ViU2pHMkdza0FfTnc%7C%7C?hl=en","themes":["interactive_exhibits","architecture"]},{"quote":"Great exhibits, interactive displays, etc ..  Planned to stop for just a couple of hrs but stayed for 3.","draw":"dwell time","author":"Jeffrey B.","source":"google","date":"2026-10-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT201eE5XdFVaa2hNYm5OV1NtWkJSMlpOWTFadWMyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm5xNWtUZkhMbnNWSmZBR2ZNY1Zuc2c%7C%7C?hl=en","themes":["interactive_exhibits","dwell_time"]},{"quote":"The exterior boardwalk and views of the park are breathtaking.","draw":"the badlands view","author":"Mary S.","source":"google","date":"2026-10-24","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21kQ01IQllUM0JFVW10ME5HOUtTVkpqTlc5d09YYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmdCMHBYT3BEUmt0NG9KSVJjNW9wOXc%7C%7C?hl=en","themes":["boardwalk_trails","landscape"]},{"quote":"It is so full of information. Was like the best history lesson ever.","draw":"worth the visit","author":"Esther R.","source":"google","date":"2026-10-24","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2t4UWJYbFdNbFJqTldGblZVczVlamcyVW5aSE4zYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkxQbXlWMlRjNWFnVUs5ejg2UnZHN3c%7C%7C?hl=en","themes":["interpretation"]},{"quote":"An incredibly interactive presidential library experience-state of the art and appealing to all ages!","draw":"interactive for all ages","author":"sydney E.","source":"google","date":"2026-10-23","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2t0SExVVjBXVkV0UW1aZlJuSnFTbkpwTkZsRE1rRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOktHLUV0WVEtQmZfRnJqSnJpNFlDMkE%7C%7C?hl=en","themes":["interactive_exhibits","families"]},{"quote":"Architecture is incredible. Exhibits are fun and engaging and interactive.","draw":"architecture and interactive","author":"Ladd C.","source":"google","date":"2026-10-23","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25WVlIyOXFhMWx1V25wRlJ6ZEZVa2xSTWpBd1QwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnVVR29qa1luWnpFRzdFUklRMjAwT0E%7C%7C?hl=en","themes":["architecture","interactive_exhibits"]},{"quote":"Have visited almost all the Presidential Libraries and Museums, and the new TR Library is far and away the best of them all.","draw":"peer comparison","author":"Michael K.","source":"google","date":"2026-10-23","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xwQ1JFbEJkbGhXUld4WlMydFRhMkY1ZVZSak5XYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlpCRElBdlhWRWxZS2tTa2F5eVRjNWc%7C%7C?hl=en","themes":["peer_comparison"]},{"quote":"The setting, the architecture, the AI experience with the Transport journal & the photo ops,& the walking path was so perfect.","draw":"architecture","author":"Kathleen N.","source":"google","date":"2026-10-22","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT205V1YwSnpVR1F0WDNkTGIwMXpOek5tUVVaVlprRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm9WV0JzUGQtX3dLb01zNzNmQUZVZkE%7C%7C?hl=en","themes":["architecture"]},{"quote":"Definitely give yourself 3-4 hours and take in everything it has to offer","draw":"dwell time","author":"Amy A.","source":"google","date":"2026-10-19","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25CUWQwVXpPVEkyWTFwSE0yaFBiMjFZVW5scmJVRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnBQd0UzOTI2Y1pHM2hPb21YUnlrbUE%7C%7C?hl=en","themes":["dwell_time"]},{"quote":"The views from within are done with the highest quality bringing the outdoors, inside.","draw":"the badlands view","author":"George E.","source":"yelp","date":"2026-10-19","url":"https://www.yelp.com/biz/theodore-roosevelt-presidential-library-medora-2?hrid=Qlje6LN_j1Ne1T1eDl_zuQ","themes":["landscape"]},{"quote":"Fantastic facility. History, pride integrity & valor and honorable President.","draw":"worth the drive","author":"Cory L.","source":"google","date":"2026-10-18","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xWNFV6WnVhemx4YTA5RVUyTlVTR0pDUjFGc1EyYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlV4UzZuazlxa09EU2NUSGJCR1FsQ2c%7C%7C?hl=en","themes":["interpretation"]},{"quote":"You can easily spend 4 hours inside this place looking at everything, and walking the loop outside.","draw":"worth the drive","author":"C. S.","source":"google","date":"2026-10-17","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2taTWRHUTVURUZqVVdoT2NDMVJWa2ROYTA1TGJtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkZMdGQ5TEFjUWhOcC1RVkdNa05Lbmc%7C%7C?hl=en","themes":["dwell_time","boardwalk_trails"]},{"quote":"One of highlights of our trip. Very well done.  Loved everything about our visit.","draw":"worth the drive","author":"Wayne P.","source":"google","date":"2026-10-16","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT201eFdXTllhak0zTkVOR1QycFJRM280T1dvNFpIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm5xWWNYajM3NENGT2pRQ3o4OWo4ZHc%7C%7C?hl=en","themes":[]},{"quote":"Be sure to take a walk on the roof especially when the prairie flowers are in bloom.","draw":"rooftop view","author":"sullific","source":"tripadvisor","date":"2026-10-14","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1081849629-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["rooftop"]},{"quote":"The grounds around  the Library are gorgeous.  The views are breathtaking.","draw":"the badlands view","author":"R C.","source":"google","date":"2026-10-13","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2sxa1dYcFNValZETTBsNlEwaEVSRFkxZVdKUmRtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOk1kWXpSUjVDM0l6Q0hERDY1eWJRdmc%7C%7C?hl=en","themes":["landscape"]},{"quote":"Brilliant architecture, fantastic setting, and exceptional artifacts from the life of Theodore Roosevelt.","draw":"architecture and artifacts","author":"Rachel K.","source":"tripadvisor","date":"2026-10-13","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1081599257-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["architecture"]},{"quote":"The galleries are well laid out and the amount of history there was amazing.","draw":"well laid out galleries","author":"Jay J.","source":"tripadvisor","date":"2026-10-12","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1081545156-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interpretation"]},{"quote":"Takes 2 hrs if you're quick & up to 4 hrs to fully participate & enjoy a most memorable experience!","draw":"dwell time","author":"Donna B.","source":"google","date":"2026-10-10","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tWUGFEQlNkVk5VU21KdGVHTlVRVlJsZG1kV2JtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkVPaDBSdVNUSmJteGNUQVRldmdWbmc%7C%7C?hl=en","themes":["dwell_time"]},{"quote":"Great interactive AI library.  This is a wonderful tribute to a President, husband, father, military leader and adventurer.","draw":"interactive_exhibits","author":"John B.","source":"google","date":"2026-10-09","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pCcExUbE5ZelpFYlZCbVdYRTVTV2xPTUVJMVpGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjBpLTlNYzZEbVBmWXE5SWlOMEI1ZFE%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Beautiful vistas can be viewed from the rooftop and boardwalk.","draw":"rooftop","author":"maddylee2015","source":"tripadvisor","date":"2026-10-09","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1081170473-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["rooftop","boardwalk_trails"]},{"quote":"The presentation using narration and technology to convey the story of Roosevelts life was simply incredible.","draw":"immersive storytelling","author":"Josh G.","source":"google","date":"2026-10-08","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xoVWNFbGtWR1JzU2tGUlNFdzFUbE5vZG5NME5XYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlhUcElkVGRsSkFRSEw1TlNodnM0NWc%7C%7C?hl=en","themes":["interpretation","interactive_exhibits"]},{"quote":"It has fun and interesting interactive exhibits. Perfect for a  family visit or a journey back in time","draw":"families","author":"Sharon H.","source":"tripadvisor","date":"2026-10-07","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1080930230-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interactive_exhibits","families"]},{"quote":"The library is an architectural and technological innovation.","draw":"architectural innovation","author":"Caryn B.","source":"google","date":"2026-10-07","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xOTGNIaDNWVFppYlcwelJrbHZYMFpETlZsS1ZXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlNLcHh3VTZibW0zRklvX0ZDNVlKVWc%7C%7C?hl=en","themes":["architecture"]},{"quote":"The depth in which the curators has told his story makes this worthy of 10-stars, as well.","draw":"deep storytelling","author":"Kim G.","source":"google","date":"2026-10-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT205UGIwc3lVbnBFUWtsaVluRkdXV1pqZDJSS2JFRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm9Pb0syUnpEQkliYnFGWWZjd2RKbEE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"They have used AI and tech to advance the enjoyment of the visitors","draw":"interactive_exhibits","author":"Linda W.","source":"google","date":"2026-10-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT201blQwOHdhRkpmTUhZNExWRk5lbVpyYUdGWE5YYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOm5nT08waFJfMHY4LVFNemZraGFXNXc%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"He was an inspiring individual with many life experiences. This library manages to help you live them.","draw":"interpretation","author":"Michael T.","source":"google","date":"2026-10-06","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25ad1ZVUmpXV0prWWxVME5sVk5Ta05LTTNCRFMwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnZwVURjWWJkYlU0NlVNSkNKM3BDS0E%7C%7C?hl=en","themes":["interpretation"]},{"quote":"You can even walk on the roof as there are walking paths up there with amazing views.","draw":"rooftop","author":"Joshua L.","source":"google","date":"2026-10-05","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pGNVNtSm5Zek5wWDNsMU5uTndaVjl5VjJoRmNrRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjF5SmJnYzNpX3l1NnNwZV9yV2hFckE%7C%7C?hl=en","themes":["rooftop"]},{"quote":"The inside walls are built of compacted earth, with different colors of soil that mimics the different colors of the nearby park.","draw":"unique building materials","author":"Rick H.","source":"tripadvisor","date":"2026-10-05","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1080629387-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["architecture"]},{"quote":"The interactive displays, the history, and the atmosphere were fantastic.","draw":"engaging atmosphere","author":"Keith V.","source":"google","date":"2026-10-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2t0TVMwdExRVVp5WlhveU1ucGtVM0kwT1hkRGVuYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOktMS0tLQUZyZXoyMnpkU3I0OXdDenc%7C%7C?hl=en","themes":["interactive_exhibits","interpretation"]},{"quote":"The Theodore Roosevelt Presidential Library is packed with incredible interactive exhibits and fantastic AI-generated imagery that brings history to life.","draw":"immersive experience","author":"Jerry J.","source":"google","date":"2026-10-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xSQ1IyaFJiMHBGZDAwMGJqaFpkVTF4VFRaVmMwRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOlRCR2hRb0pFd000bjhZdU1xTTZVc0E%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"Perfect for young & old.  Lots of interactive opportunities to keep everyone entertained.","draw":"families","author":"CHP4JC","source":"google","date":"2026-10-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pscVRGRldNbTlmWjFsalIyWkhPWGhCV1dsR1VHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjlqTFFWMm9fZ1ljR2ZHOXhBWWlGUGc%7C%7C?hl=en","themes":["families","interactive_exhibits"]},{"quote":"Phenomenal interactive exhibits.... Great for kids and adults who like acting like kids","draw":"families","author":"Kirk C.","source":"google","date":"2026-10-04","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tNMk16aG1Wa016TVY4dExUbFJMVWMyWXpONWVIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkM2MzhmVkMzMV8tLTlRLUc2YzN5eHc%7C%7C?hl=en","themes":["families","interactive_exhibits"]},{"quote":"The interactive exhibits and good flow of patrons enabled us to enjoy the many sections of the museum without feeling rushed.","draw":"visitor flow","author":"m C.","source":"yelp","date":"2026-10-03","url":"https://www.yelp.com/biz/theodore-roosevelt-presidential-library-medora-2?hrid=2H_3umDFj0xDz8GCU-tv7w","themes":["interactive_exhibits","visitor_flow"]},{"quote":"The interactive part was such a highlight and the timeliness of TR was so detailed.","draw":"engaging exhibits","author":"Nancy R.","source":"google","date":"2026-10-02","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tGZlRFOXZXRE4yY1cxdE1rd3lkWFYwZW0wNFZYYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkFfTE9vWDN2cW1tMkwydXV0em04VXc%7C%7C?hl=en","themes":["interactive_exhibits","interpretation"]},{"quote":"The town, library, National Park, lots to do. Library will take at least 4 hours to tour.","draw":"enough to fill a day","author":"mike P.","source":"google","date":"2026-10-01","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25VeWFHOHdiWGw0VGs5VGIxRkJlV0ZYWmxoWGRtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnUyaG8wbXl4Tk9Tb1FBeWFXZlhXdmc%7C%7C?hl=en","themes":["dwell_time","drive_market"]},{"quote":"Lots of interaction and information on an amazing President! You can even take a hike on top of the Library.","draw":"rooftop hike","author":"Julie W.","source":"google","date":"2026-09-30","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2s5YWVrY3lTemRzUjB4cWNGWktSa2xVZHkxSE9XYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOk9aekcySzdsR0xqcFZKRklUdy1HOWc%7C%7C?hl=en","themes":["interactive_exhibits","rooftop"]},{"quote":"Well thought out layout with central timeline and in depth experiences surrounding central story line. Something for everyone.","draw":"something for everyone","author":"Roger C.","source":"google","date":"2026-09-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21sMlkzcHhRazlETjBOTFozSkZVbkk0YTJZNVNIYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOml2Y3pxQk9DN0NLZ3JFUnI4a2Y5SHc%7C%7C?hl=en","themes":["interpretation","interactive_exhibits"]},{"quote":"As a history lover, I thoroughly enjoyed the new presidential library and so did my wife  (who is not so fond of history).","draw":"appeals to all visitors","author":"JWN","source":"tripadvisor","date":"2026-09-28","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1079695901-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["interpretation"]},{"quote":"Beautiful architecture, too, that blends with the landscape and highlights what makes the North Dakota Badlands so striking. I also really enjoyed the restored prairie on the roof of the building","draw":"rooftop","author":"Stephen W.","source":"google","date":"2026-09-28","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2prd1lXcHJiME40ZDNCWVQzRlNPWHBXVUVVMlUzYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjkwYWprb0N4d3BYT3FSOXpWUEU2U3c%7C%7C?hl=en","themes":["architecture","rooftop","landscape"]},{"quote":"A spectacular experience and a great experience for young and old alike","draw":"appeals to all ages","author":"barbara","source":"google","date":"2026-09-27","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25Zek5Hb3lNelpoWVRCcFYyTnRkMEpwZWxCMWNtYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnYzNGoyMzZhYTBpV2Ntd0JpelB1cmc%7C%7C?hl=en","themes":["families"]},{"quote":"The setting, the building, and the display experience are all amazing.  Take the time to experience all of them.","draw":"worth the visit","author":"Dan H.","source":"google","date":"2026-09-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25wWVRERTRTWE5tTW5aMlpVUnpRMmxzUkhWNmJXYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOnpYTDE4SXNmMnZ2ZURzQ2lsRHV6bWc%7C%7C?hl=en","themes":["architecture","interpretation"]},{"quote":"We spent about 4 and a half hours here. We really enjoyed the new Technology Incorporated with all of Theodore Roosevelt's history.","draw":"worth a long visit","author":"Johnny G.","source":"google","date":"2026-09-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21KR1dEbEVVWEZxVDBoV2MxVXljVkUyV1drMFNsRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmJGWDlEUXFqT0hWc1UycVE2WWk0SlE%7C%7C?hl=en","themes":["interactive_exhibits"]},{"quote":"loved the Theodore Roosevelt life timeline exhibit set up, extra rooms off to the sides for more depth and exploration.","draw":"themed exhibits","author":"Doreen C.","source":"google","date":"2026-09-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pOV1ZWaHViVXBoZEZWWVZHeGxORVZTVlZNd2FGRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOjNWVVhubUphdFVYVGxlNEVSVVMwaFE%7C%7C?hl=en","themes":["interpretation"]},{"quote":"There are a number of theaters that give dramatic multimedia readings of events, and walking trails to view the lands that Roosevelt once traveled as a rancher.","draw":"boardwalk trails","author":"Sherrie R.","source":"google","date":"2026-09-26","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2tGZlRVNDFUMVE0UlRoemFIUkhTV1pXVmpGcVNFRRAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkFfTU41T1Q4RThzaHRHSWZWVjFqSEE%7C%7C?hl=en","themes":["boardwalk_trails"]},{"quote":"A great mix of interactive exhibits, short films, and artifacts.","draw":"varied exhibits","author":"Riley J.","source":"google","date":"2026-09-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21sNVh6QlFNVTB4VkhaRmQycFFXV2hST0hCNGQzYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOml5XzBQMU0xVHZFd2pQWWhROHB4d3c%7C%7C?hl=en","themes":["interactive_exhibits","interpretation"]},{"quote":"Really well done, great exhibits and interactivity.  The views and walk way are great.","draw":"great exhibits and views","author":"Aakash J.","source":"google","date":"2026-09-25","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT21GSGRIZDFiVWhWYkVrMU9FZzRZbFpWZDNaTlNHYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOmFHdHd1bUhVbEk1OEg4YlZVd3ZNSGc%7C%7C?hl=en","themes":["interactive_exhibits","boardwalk_trails","landscape"]},{"quote":"Apparently the  size of the facility plus everything to do outside helps spread everyone out.","draw":"visitor flow","author":"Judy D.","source":"tripadvisor","date":"2026-09-25","url":"https://www.tripadvisor.com/ShowUserReviews-g60973-d34391224-r1079217508-Theodore_Roosevelt_Presidential_Library-Medora_North_Dakota.html","themes":["visitor_flow"]},{"quote":"There are many interactive exhibits, great movie settings, places to sit and rest a bit, and \"seek and find\" activities, that are especially fun for kids.","draw":"interactive and kid-friendly activities","author":"Rochelle N.","source":"google","date":"2026-09-24","url":"https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2taSmRGOXJhRFZ2ZUdWMmJEVlJhRWhDVm0xeE1HYxAB!2m1!1s0x0:0x588995e798312048!3m1!1s2@1:CAIQACodChtycF9oOkZJdF9raDVveGV2bDVRaEhCVm1xMGc%7C%7C?hl=en","themes":["interactive_exhibits","families"]}];
  var TOPICS = {"visit":["dwell_time","interactive_exhibits","families","peer_comparison","value_for_money"],"exhibits":["interactive_exhibits","interpretation","historical_balance","guided_tours"],"outdoors":["boardwalk_trails","landscape","rooftop","conservation_message"],"hiking":["boardwalk_trails","landscape","rooftop"],"biking":["boardwalk_trails","landscape"],"architecture":["architecture","landscape","rooftop"],"landscape":["landscape","conservation_message","boardwalk_trails"],"itineraries":["dwell_time","landscape","drive_market"],"planner":["dwell_time","families","value_for_money"],"families":["families","age_tiers","interactive_exhibits"],"groups":["families","age_tiers","guided_tours"],"tours":["guided_tours","interpretation"],"shopping":["retail","retail_pricing"],"eat":["food_beverage"],"directions":["drive_market","landscape"],"tickets":["value_for_money","timed_entry","dwell_time"],"membership":["value_for_money","dwell_time","peer_comparison"],"accessibility":["accessibility","staff"]};
  var GENERATED = "2026-10-30";
  if (!QUOTES.length) return;

  // The business's own accent, written in at build time from
  // config.json > entities.<slug>.brand.accent. It is only ever a *fallback*: an explicit
  // data-accent on the embed still wins, and pickAccent below will drop it for the
  // foreground colour if it fails contrast against whatever background it lands on.
  //
  // The Library's bundle substitutes its existing #8B2E1F, so embed.js — which is already
  // in script tags across trlibrary.com — comes out byte-identical to before this change.
  var BRAND = "#8B2E1F";
  var BRAND_DARK = "#E8927C";
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
    // BRAND on light blocks, BRAND_DARK on dark ones. Both are written in per business
    // at build time: a flat brand red that reads on paper is usually too dark to clear
    // 3:1 on the same brand's black, so the dark variant is a lightened version of the
    // same hue rather than a different colour.
    var candidates = [requested, luminance(bg) < 0.45 ? BRAND_DARK : BRAND, fg];
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

  /**
   * The first gold that actually reads on this background.
   *
   * Same shape as pickAccent, deliberately: one contrast rule, applied twice, rather than
   * two colour policies that can disagree. `bg` is resolved by the caller.
   */
  function pickStar(candidates, fg, bg) {
    candidates = candidates.concat([fg]);
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

  function styles(dark, ac, align, media, bg) {
    // Plain white on dark, not the cream used elsewhere in the brand. Over a photograph the
    // cream reads as dirty; white reads as intentional.
    var fg = dark ? "#FFFFFF" : "#241C17";
    var muted = dark ? "rgba(255,255,255,.78)" : "rgba(36,28,23,.58)";
    var rule = dark ? "rgba(255,255,255,.28)" : "rgba(36,28,23,.14)";
    var chip = dark ? "rgba(255,255,255,.16)" : "rgba(36,28,23,.05)";
    // Stars get their own colour, not the accent. A rating reads as a rating when it is
    // gold — brand red on a red block was both invisible and unfamiliar. Deepened on light
    // backgrounds, where bright gold falls under 3:1 against white.
    //
    // Picked by contrast rather than by the light/dark flag alone. A mid-tone background
    // can be "light" by luminance and still sit far too close to the deep gold: Salt +
    // Scoria's warm sand (#D1CCBD) put the stars at 2.03:1, under the 3:1 floor for
    // non-text, while passing the dark check. The Library's own #F1EBE0 was failing at
    // 2.74:1 for the same reason.
    //
    // #8A6508 exists for exactly those mid-tones: the shallowest gold that clears 3:1 on
    // every background either brand uses. It matters that the fallback is another gold
    // rather than the foreground colour — a rating reads as a rating when it is gold, so
    // dropping to near-black would fix the contrast and lose the meaning. The foreground
    // stays last in the chain for a background no gold survives.
    var star = pickStar(dark ? ["#FFC24A", "#B8860B"] : ["#B8860B", "#8A6508"], fg, bg);
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
    sheet.textContent = styles(dark, ac, align, back.media, bg);
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
