// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as d3 from "d3";

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

const C = {
  stakePresident: { id: "stakePresident", title: "Stake President", short: "Stake Pres.", level: "stake", color: "#60a5fa", radius: 20, reportsTo: null, group: "stake",
    desc: "Presiding high priest of the stake. Holds priesthood keys. Provides guidance and counsel to all bishops.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering","youthDev","worship","recordsFinance"],
    meetings: ["stakeConference","highCouncilMeeting","stakeCouncil","stakePriesthoodLeadership"],
    keyDuties: ["Holds priesthood keys for the stake","Provides guidance to bishops","Calls/sets apart bishops and stake leaders","Conducts stake conference","Meets monthly with mission president","Leads stake council and high council"] },
  highCouncilor: { id: "highCouncilor", title: "High Councilors (12)", short: "High Council", level: "stake", color: "#818cf8", radius: 16, reportsTo: "stakePresident", group: "stake",
    desc: "Twelve high priests assisting the stake presidency. Each assigned to specific wards and elders quorums.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering"],
    meetings: ["highCouncilMeeting","stakeCouncil","stakePriesthoodLeadership"],
    keyDuties: ["Assigned to specific wards for support","Instruct newly called EQ presidencies","Meet regularly with assigned EQ leaders","May speak in ward sacrament meetings","Some assigned to stake YW, Primary, SS"] },
  stakeRS: { id: "stakeRS", title: "Stake RS Presidency", short: "Stake RS", level: "stake", color: "#c084fc", radius: 14, reportsTo: "stakePresident", group: "stake",
    desc: "Instructs and supports ward RS presidencies in missionary, temple/FH, and ministering.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering"],
    meetings: ["stakeCouncil","stakePriesthoodLeadership"],
    keyDuties: ["Orient newly called ward RS presidencies","Instruct ward RS in missionary & temple/FH duties","Serve on stake council"] },
  stakeYW: { id: "stakeYW", title: "Stake YW Presidency", short: "Stake YW", level: "stake", color: "#fb923c", radius: 14, reportsTo: "stakePresident", group: "stake",
    desc: "Instructs and supports ward YW presidencies.",
    responsibilities: ["youthDev","livingGospel"],
    meetings: ["stakeCouncil"],
    keyDuties: ["Orient newly called ward YW presidencies","Help plan stake youth activities and FSY"] },
  stakePrimary: { id: "stakePrimary", title: "Stake Primary Pres.", short: "Stake Primary", level: "stake", color: "#fbbf24", radius: 14, reportsTo: "stakePresident", group: "stake",
    desc: "Instructs and supports ward Primary presidencies.",
    responsibilities: ["youthDev","livingGospel"],
    meetings: ["stakeCouncil"],
    keyDuties: ["Orient newly called ward Primary presidencies","Support ward Primary leaders"] },
  stakeSS: { id: "stakeSS", title: "Stake SS President", short: "Stake SS", level: "stake", color: "#67e8f9", radius: 12, reportsTo: "stakePresident", group: "stake",
    desc: "High councilor overseeing Sunday School in the stake.",
    responsibilities: ["livingGospel","worship"],
    meetings: ["stakeCouncil"],
    keyDuties: ["Orient newly called ward SS presidencies","Support gospel learning and teaching"] },
  bishop: { id: "bishop", title: "Bishop", short: "Bishop", level: "ward", color: "#3b82f6", radius: 24, reportsTo: "stakePresident", group: "bishopric",
    desc: "Holds priesthood keys for the ward. Presiding high priest. Common judge. Foremost responsibility is the rising generation.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering","youthDev","worship","recordsFinance"],
    meetings: ["sacramentMeeting","bishopricMeeting","wardCouncil","wardYouthCouncil"],
    keyDuties: ["Coordinates God's work of salvation and exaltation","Foremost responsibility to the rising generation","Presides at ward meetings","Plans/conducts ward council & youth council","President of the priests quorum","Worthiness interviews & tithing declaration","Oversees records, finances, meetinghouse","Approves fast-offering use & ministering assignments"] },
  bishopC1: { id: "bishopC1", title: "1st Counselor (Bishopric)", short: "Bish. 1st C.", level: "ward", color: "#60a5fa", radius: 15, reportsTo: "bishop", group: "bishopric",
    desc: "Assists bishop. Conducts meetings. Presides in bishop's absence. Oversees assigned AP quorum.",
    responsibilities: ["livingGospel","caringForNeedy","youthDev","worship"],
    meetings: ["sacramentMeeting","bishopricMeeting","wardCouncil"],
    keyDuties: ["Assists bishop in all duties","May conduct sacrament meeting","Presides in bishop's absence","Oversees assigned AP quorum"] },
  bishopC2: { id: "bishopC2", title: "2nd Counselor (Bishopric)", short: "Bish. 2nd C.", level: "ward", color: "#60a5fa", radius: 15, reportsTo: "bishop", group: "bishopric",
    desc: "Assists bishop. Conducts meetings. Oversees assigned AP quorum. May be building rep.",
    responsibilities: ["livingGospel","caringForNeedy","youthDev","worship"],
    meetings: ["sacramentMeeting","bishopricMeeting","wardCouncil"],
    keyDuties: ["Assists bishop in all duties","May conduct meetings","Oversees assigned AP quorum","May be ward building representative"] },
  wardClerk: { id: "wardClerk", title: "Ward Clerk", short: "Clerk", level: "ward", color: "#94a3b8", radius: 11, reportsTo: "bishop", group: "bishopric",
    desc: "Assists with records and finances. Member of ward council.",
    responsibilities: ["recordsFinance"], meetings: ["wardCouncil","bishopricMeeting"],
    keyDuties: ["Attends ward council","Assists with records and reports","Helps with finances"] },
  execSec: { id: "execSec", title: "Executive Secretary", short: "Exec. Sec.", level: "ward", color: "#94a3b8", radius: 11, reportsTo: "bishop", group: "bishopric",
    desc: "Prepares agendas. Serves on ward council. Schedules appointments.",
    responsibilities: ["recordsFinance"], meetings: ["wardCouncil","bishopricMeeting"],
    keyDuties: ["Prepares bishopric agendas","Serves on ward council","Schedules appointments and interviews"] },
  eqPres: { id: "eqPres", title: "Elders Quorum President", short: "EQ Pres.", level: "ward", color: "#22c55e", radius: 20, reportsTo: "bishop", stakeReport: "highCouncilor", group: "eq",
    desc: "Leads the elders quorum. Directly responsible to stake presidency. Delegates missionary to 1st Counselor and temple/FH to 2nd.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering"],
    meetings: ["wardCouncil","eqPresidency","missionaryCoord","templeFHCoord"],
    keyDuties: ["Serves on ward council","Leads quorum's work of salvation","Oversees ministering brothers","Coordinates ministering with RS (quarterly)","Delegates missionary work to 1st Counselor","Delegates temple/FH to 2nd Counselor","Meets regularly with assigned high councilor"] },
  eqC1: { id: "eqC1", title: "EQ 1st Counselor", short: "EQ 1st C.", level: "ward", color: "#4ade80", radius: 13, reportsTo: "eqPres", group: "eq",
    desc: "Delegated responsibility for member missionary work. Works with ward mission leader.",
    responsibilities: ["missionary","livingGospel"], meetings: ["eqPresidency","missionaryCoord"],
    keyDuties: ["Oversees missionary work in EQ","Works with ward mission leader","Attends weekly missionary coordination","May fill ward mission leader role"] },
  eqC2: { id: "eqC2", title: "EQ 2nd Counselor", short: "EQ 2nd C.", level: "ward", color: "#4ade80", radius: 13, reportsTo: "eqPres", group: "eq",
    desc: "Delegated responsibility for temple and family history work. Works with T&FH leader.",
    responsibilities: ["templeFH","livingGospel"], meetings: ["eqPresidency","templeFHCoord"],
    keyDuties: ["Oversees temple & family history in EQ","Works with ward T&FH leader","Attends T&FH coordination meetings"] },
  rsPres: { id: "rsPres", title: "Relief Society President", short: "RS Pres.", level: "ward", color: "#a855f7", radius: 20, reportsTo: "bishop", stakeReport: "stakeRS", group: "rs",
    desc: "Leads the Relief Society. Works in unity with EQ. Delegates missionary to 1st Counselor and temple/FH to 2nd.",
    responsibilities: ["livingGospel","caringForNeedy","missionary","templeFH","ministering"],
    meetings: ["wardCouncil","rsPresidency","missionaryCoord","templeFHCoord"],
    keyDuties: ["Serves on ward council","Leads RS work of salvation","Oversees ministering sisters","Coordinates ministering with EQ (quarterly)","Delegates missionary to 1st Counselor","Delegates temple/FH to 2nd Counselor","Coordinates compassionate service"] },
  rsC1: { id: "rsC1", title: "RS 1st Counselor", short: "RS 1st C.", level: "ward", color: "#c084fc", radius: 13, reportsTo: "rsPres", group: "rs",
    desc: "Delegated responsibility for member missionary work in RS. Works with ward mission leader.",
    responsibilities: ["missionary","livingGospel"], meetings: ["rsPresidency","missionaryCoord"],
    keyDuties: ["Oversees missionary work in RS","Works with ward mission leader","Attends weekly missionary coordination"] },
  rsC2: { id: "rsC2", title: "RS 2nd Counselor", short: "RS 2nd C.", level: "ward", color: "#c084fc", radius: 13, reportsTo: "rsPres", group: "rs",
    desc: "Delegated responsibility for temple and family history work in RS.",
    responsibilities: ["templeFH","livingGospel"], meetings: ["rsPresidency","templeFHCoord"],
    keyDuties: ["Oversees temple & family history in RS","Works with ward T&FH leader","Attends T&FH coordination"] },
  ywPres: { id: "ywPres", title: "Young Women President", short: "YW Pres.", level: "ward", color: "#f97316", radius: 17, reportsTo: "bishop", stakeReport: "stakeYW", group: "yw",
    desc: "Leads YW. Serves on ward council and youth council. Supports young women ages 12–17.",
    responsibilities: ["livingGospel","youthDev","ministering","templeFH"],
    meetings: ["wardCouncil","wardYouthCouncil","ywPresidency"],
    keyDuties: ["Serves on ward council","Supports young women in covenants","Plans activities and service","Supports class presidencies","Works with bishopric on FSY"] },
  ywC1: { id: "ywC1", title: "YW 1st Counselor", short: "YW 1st C.", level: "ward", color: "#fb923c", radius: 11, reportsTo: "ywPres", group: "yw",
    desc: "Activities, service coordination, supporting class presidencies.",
    responsibilities: ["youthDev","livingGospel"], meetings: ["ywPresidency"],
    keyDuties: ["Oversees activities and service coordination","Supports class presidencies","Helps with youth conferences"] },
  ywC2: { id: "ywC2", title: "YW 2nd Counselor", short: "YW 2nd C.", level: "ward", color: "#fb923c", radius: 11, reportsTo: "ywPres", group: "yw",
    desc: "Temple preparation, individual ministering, personal goals.",
    responsibilities: ["youthDev","templeFH","ministering"], meetings: ["ywPresidency"],
    keyDuties: ["Oversees temple preparation","Supports individual ministering","Helps with personal goals"] },
  primaryPres: { id: "primaryPres", title: "Primary President", short: "Primary Pres.", level: "ward", color: "#eab308", radius: 17, reportsTo: "bishop", stakeReport: "stakePrimary", group: "primary",
    desc: "Leads Primary for children ages 3–11. Serves on ward council. Attends missionary and T&FH coordination.",
    responsibilities: ["livingGospel","youthDev","missionary","templeFH"],
    meetings: ["wardCouncil","primaryPresidency","missionaryCoord","templeFHCoord"],
    keyDuties: ["Serves on ward council","Helps council know each child","Plans Sunday Primary meetings","Attends missionary & T&FH coordination","Plans annual Primary program"] },
  primaryC1: { id: "primaryC1", title: "Primary 1st Counselor", short: "Prim. 1st C.", level: "ward", color: "#facc15", radius: 11, reportsTo: "primaryPres", group: "primary",
    desc: "Helps parents prepare children for baptism and confirmation.",
    responsibilities: ["livingGospel","youthDev"], meetings: ["primaryPresidency"],
    keyDuties: ["Helps parents prepare children for baptism","Coordinates baptism preparation meetings"] },
  primaryC2: { id: "primaryC2", title: "Primary 2nd Counselor", short: "Prim. 2nd C.", level: "ward", color: "#facc15", radius: 11, reportsTo: "primaryPres", group: "primary",
    desc: "Helps parents with temple and priesthood preparation for children.",
    responsibilities: ["templeFH","youthDev"], meetings: ["primaryPresidency"],
    keyDuties: ["Helps parents with temple/priesthood prep","Makes parents aware of resources"] },
  ssPres: { id: "ssPres", title: "Sunday School President", short: "SS Pres.", level: "ward", color: "#06b6d4", radius: 15, reportsTo: "bishop", stakeReport: "stakeSS", group: "ss",
    desc: "Oversees gospel learning and teaching. Serves on ward council. Leads teacher councils.",
    responsibilities: ["livingGospel","worship"],
    meetings: ["wardCouncil","teacherCouncil"],
    keyDuties: ["Serves on ward council","Oversees gospel learning/teaching","Organizes classes","Leads quarterly teacher council meetings"] },
  ssC1: { id: "ssC1", title: "SS 1st Counselor", short: "SS 1st C.", level: "ward", color: "#22d3ee", radius: 10, reportsTo: "ssPres", group: "ss",
    desc: "Supports adult Sunday School classes and teachers.",
    responsibilities: ["livingGospel","worship"], meetings: ["teacherCouncil"],
    keyDuties: ["Supports adult SS classes","Helps instruct teachers"] },
  ssC2: { id: "ssC2", title: "SS 2nd Counselor", short: "SS 2nd C.", level: "ward", color: "#22d3ee", radius: 10, reportsTo: "ssPres", group: "ss",
    desc: "Supports youth Sunday School classes and teachers.",
    responsibilities: ["livingGospel","worship"], meetings: ["teacherCouncil"],
    keyDuties: ["Supports youth SS classes","Helps instruct teachers"] },
  wardMissionLeader: { id: "wardMissionLeader", title: "Ward Mission Leader", short: "Mission Ldr.", level: "ward", color: "#34d399", radius: 14, reportsTo: "bishop", group: "support",
    worksWith: ["eqC1", "rsC1"],
    desc: "Coordinates ward missionary efforts. Conducts weekly missionary coordination meetings. Works closely with EQ and RS 1st Counselors who are delegated missionary responsibility.",
    responsibilities: ["missionary"], meetings: ["missionaryCoord","wardCouncil"],
    keyDuties: ["Conducts weekly missionary coordination","Coordinates with full-time missionaries","Works with EQ 1st Counselor on missionary efforts","Works with RS 1st Counselor on missionary efforts","May be invited to ward council"] },
  templeFHLeader: { id: "templeFHLeader", title: "Temple & FH Leader", short: "T&FH Ldr.", level: "ward", color: "#2dd4bf", radius: 14, reportsTo: "bishop", group: "support",
    worksWith: ["eqC2", "rsC2"],
    desc: "Leads temple and family history coordination meetings. Coordinates consultants. Works closely with EQ and RS 2nd Counselors who are delegated temple/FH responsibility.",
    responsibilities: ["templeFH"], meetings: ["templeFHCoord","wardCouncil"],
    keyDuties: ["Leads T&FH coordination meetings","Coordinates family history consultants","Works with EQ 2nd Counselor on temple/FH","Works with RS 2nd Counselor on temple/FH","May be invited to ward council"] },
};

const MEETINGS = {
  sacramentMeeting: { id: "sacramentMeeting", title: "Sacrament Meeting", short: "Sacrament", freq: "Weekly (Sun)", color: "#3b82f6", bg: "#1e3a5f",
    attendees: ["bishop","bishopC1","bishopC2","wardClerk","execSec"],
    desc: "Primary worship. Sacrament, talks, testimonies, ward business. One hour.", flow: "Bishopric → All Ward Members",
    topics: ["Sacrament ordinance","Gospel talks","Ward business","Sustaining callings"] },
  bishopricMeeting: { id: "bishopricMeeting", title: "Bishopric Meeting", short: "Bishopric Mtg", freq: "Weekly", color: "#60a5fa", bg: "#1e3050",
    attendees: ["bishop","bishopC1","bishopC2","wardClerk","execSec"],
    desc: "Bishopric plans ward matters, callings, sacrament meeting, member needs.", flow: "Bishop ↔ Counselors, Clerk, Exec Sec",
    topics: ["Sacrament planning","Callings","Member needs","Budget","Assignments"] },
  wardCouncil: { id: "wardCouncil", title: "Ward Council", short: "Ward Council", freq: "Usually weekly", color: "#22c55e", bg: "#14332a",
    attendees: ["bishop","bishopC1","bishopC2","wardClerk","execSec","eqPres","rsPres","ywPres","primaryPres","ssPres"],
    optional: ["wardMissionLeader","templeFHLeader"],
    desc: "Central coordinating council. Organization presidents represent members.", flow: "Bishop ↔ Org Presidents → Organizations",
    topics: ["Work of salvation","Individual needs","Ministering","Missionary","Temple & FH","Youth","Budget & activities"] },
  wardYouthCouncil: { id: "wardYouthCouncil", title: "Ward Youth Council", short: "Youth Council", freq: "Monthly", color: "#f97316", bg: "#3d2008",
    attendees: ["bishop","bishopC1","bishopC2","ywPres"],
    desc: "Focused on youth. Includes youth quorum/class presidents. Youth may conduct.", flow: "Bishop ↔ Youth Leaders → Youth Orgs",
    topics: ["Youth needs","Outreach","Activities","Service","Ministering"] },
  missionaryCoord: { id: "missionaryCoord", title: "Missionary Coordination", short: "Mission Coord.", freq: "Weekly (brief)", color: "#34d399", bg: "#0d3326",
    attendees: ["wardMissionLeader","eqC1","rsC1","primaryPres"],
    desc: "Brief weekly coordination. Helping those being taught, new/returning members.", flow: "Mission Ldr ↔ EQ/RS Counselors ↔ Missionaries",
    topics: ["Those being taught","New/returning members","Covenant Path Progress","Missionary coordination"] },
  templeFHCoord: { id: "templeFHCoord", title: "Temple & FH Coordination", short: "T&FH Coord.", freq: "Regular", color: "#2dd4bf", bg: "#0a3029",
    attendees: ["templeFHLeader","eqC2","rsC2","primaryPres"],
    desc: "Coordinates temple & family history efforts with assigned org members and consultants.", flow: "T&FH Leader ↔ Org Reps → Consultants",
    topics: ["Temple attendance","Family history research","Member needs","Youth involvement"] },
  eqPresidency: { id: "eqPresidency", title: "EQ Presidency Meeting", short: "EQ Presidency", freq: "Regular", color: "#22c55e", bg: "#0f2918",
    attendees: ["eqPres","eqC1","eqC2"],
    desc: "Counselors report on missionary/temple-FH. Plan ministering, activities, lessons.", flow: "Counselors → President → Ward Council",
    topics: ["Ministering","Missionary report (1st C.)","Temple/FH report (2nd C.)","Member needs","Activities"] },
  rsPresidency: { id: "rsPresidency", title: "RS Presidency Meeting", short: "RS Presidency", freq: "Regular", color: "#a855f7", bg: "#1f0a30",
    attendees: ["rsPres","rsC1","rsC2"],
    desc: "Counselors report on missionary/temple-FH. Plan ministering, compassionate service.", flow: "Counselors → President → Ward Council",
    topics: ["Ministering","Missionary report (1st C.)","Temple/FH report (2nd C.)","Sister needs"] },
  ywPresidency: { id: "ywPresidency", title: "YW Presidency Meeting", short: "YW Presidency", freq: "Regular", color: "#f97316", bg: "#2e1505",
    attendees: ["ywPres","ywC1","ywC2"],
    desc: "Plan activities, discuss young women needs, support class presidencies.", flow: "Counselors → President → Ward Council",
    topics: ["Young women needs","Activities (1st C.)","Temple/ministering (2nd C.)"] },
  primaryPresidency: { id: "primaryPresidency", title: "Primary Presidency", short: "Primary Pres.", freq: "Regular", color: "#eab308", bg: "#2a2005",
    attendees: ["primaryPres","primaryC1","primaryC2"],
    desc: "Plan Sunday meetings, children's needs, baptism/temple prep.", flow: "Counselors → President → Ward Council",
    topics: ["Children's needs","Baptism prep (1st C.)","Temple prep (2nd C.)","Annual program"] },
  teacherCouncil: { id: "teacherCouncil", title: "Teacher Council", short: "Teacher Council", freq: "Quarterly", color: "#06b6d4", bg: "#072a30",
    attendees: ["ssPres","ssC1","ssC2"],
    desc: "Teachers improve teaching using Teaching in the Savior's Way.", flow: "SS Pres → Teachers → Class Members",
    topics: ["Teaching improvement","Sharing methods","Teaching in the Savior's Way"] },
  highCouncilMeeting: { id: "highCouncilMeeting", title: "High Council Meeting", short: "High Council", freq: "Twice monthly", color: "#818cf8", bg: "#141530",
    attendees: ["stakePresident","highCouncilor"],
    desc: "Stake presidency with twelve high councilors. Stake business, callings, ordinations.", flow: "Stake Presidency ↔ High Councilors → Wards",
    topics: ["Stake admin","Callings","Ward reports","Instructions"] },
  stakeCouncil: { id: "stakeCouncil", title: "Stake Council", short: "Stake Council", freq: "Regular", color: "#a78bfa", bg: "#1a1535",
    attendees: ["stakePresident","highCouncilor","stakeRS","stakeYW","stakePrimary","stakeSS"],
    desc: "High council + stake org presidents. Work of salvation across the stake.", flow: "Stake Pres ↔ Council + Org Presidents → Wards",
    topics: ["Work of salvation","Org reports","Training","Budget"] },
  stakeConference: { id: "stakeConference", title: "Stake Conference", short: "Stake Conf.", freq: "Twice yearly", color: "#60a5fa", bg: "#101830",
    attendees: ["stakePresident","highCouncilor","stakeRS","stakeYW","stakePrimary","stakeSS"],
    desc: "Leadership meeting, Saturday session, Sunday session.", flow: "Stake Presidency → All Members",
    topics: ["Gospel instruction","Stake business","Leadership training"] },
  stakePriesthoodLeadership: { id: "stakePriesthoodLeadership", title: "Stake PH Leadership", short: "PH Leadership", freq: "Yearly", color: "#818cf8", bg: "#141530",
    attendees: ["stakePresident","highCouncilor","stakeRS"],
    desc: "At one stake conference per year. Priesthood/ward leader training.", flow: "Stake Presidency → Ward Leaders",
    topics: ["Priesthood duties","Work of salvation priorities","Leader training"] },
};

const RESP = {
  livingGospel: { id: "livingGospel", title: "Living the Gospel", icon: "📖", color: "#3b82f6", desc: "Strengthening faith, covenants, scripture study, prayer, gospel learning.", coordMeetings: ["wardCouncil","sacramentMeeting","teacherCouncil"] },
  caringForNeedy: { id: "caringForNeedy", title: "Caring for Those in Need", icon: "🤝", color: "#a855f7", desc: "Fast offerings, temporal help, compassionate service, self-reliance.", coordMeetings: ["wardCouncil","bishopricMeeting","eqPresidency","rsPresidency"] },
  missionary: { id: "missionary", title: "Sharing the Gospel", icon: "🌍", color: "#22c55e", desc: "Missionary work, new/returning members, full-time missionary coordination.", coordMeetings: ["missionaryCoord","wardCouncil"] },
  templeFH: { id: "templeFH", title: "Temple & Family History", icon: "⛪", color: "#2dd4bf", desc: "Temple ordinances, family history research, preparing members.", coordMeetings: ["templeFHCoord","wardCouncil"] },
  ministering: { id: "ministering", title: "Ministering", icon: "💛", color: "#f97316", desc: "Organized care. Ministering brothers (EQ) and sisters (RS). Quarterly interviews.", coordMeetings: ["wardCouncil","eqPresidency","rsPresidency"] },
  youthDev: { id: "youthDev", title: "Youth Development", icon: "⭐", color: "#eab308", desc: "Bishop's foremost focus. AP quorums, YW, Primary. Activities, FSY.", coordMeetings: ["wardYouthCouncil","wardCouncil"] },
  worship: { id: "worship", title: "Sunday Worship", icon: "🕊️", color: "#06b6d4", desc: "Sacrament meeting, Sunday classes, teaching quality.", coordMeetings: ["sacramentMeeting","bishopricMeeting","teacherCouncil"] },
  recordsFinance: { id: "recordsFinance", title: "Records & Finance", icon: "📋", color: "#94a3b8", desc: "Membership records, tithing, budget, meetinghouse.", coordMeetings: ["bishopricMeeting"] },
};

const blendWithCream = (hex, weight = 0.18) => {
  const mixed = d3.interpolateRgb("#fffaf0", hex)(weight);
  return mixed;
};

const getCallingBubbleFill = (color) => blendWithCream(color, 0.22);
const getMeetingBubbleFill = (color) => blendWithCream(color, 0.18);
const getSelectedBubbleFill = (color) => blendWithCream(color, 0.34);
const getBubbleTitleColor = (color) => d3.interpolateRgb("#1f2937", color)(0.45);
const getBubbleSecondaryTextColor = (color) => d3.interpolateRgb("#475569", color)(0.28);

// Handbook URL base
const HB = "https://www.churchofjesuschrist.org/study/manual/general-handbook";

// Handbook references per calling
const REFS = {
  stakePresident: [
    { section: "6.1", title: "Stake President — Unique Responsibilities", url: `${HB}/6-stake-leadership?lang=eng#title_number4` },
    { section: "6.2", title: "Stake President — Calling, Ordaining, Setting Apart", url: `${HB}/6-stake-leadership?lang=eng#title_number9` },
    { section: "6.3", title: "Stake Presidency — Responsibilities", url: `${HB}/6-stake-leadership?lang=eng#title_number16` },
  ],
  highCouncilor: [
    { section: "6.5", title: "High Council", url: `${HB}/6-stake-leadership?lang=eng#title_number31` },
    { section: "6.5.1", title: "Counseling with the Stake Presidency", url: `${HB}/6-stake-leadership?lang=eng#title_number32` },
    { section: "6.5.3", title: "Serving with Elders Quorums", url: `${HB}/6-stake-leadership?lang=eng#title_number34` },
  ],
  stakeRS: [
    { section: "9.3.3", title: "Stake Relief Society Presidency", url: `${HB}/9-relief-society?lang=eng#title_number14` },
    { section: "6.4.3", title: "Stake Organization Responsibilities", url: `${HB}/6-stake-leadership?lang=eng#title_number28` },
  ],
  stakeYW: [
    { section: "11.3.4", title: "Stake Young Women Presidency", url: `${HB}/11-young-women?lang=eng#title_number18` },
    { section: "6.5", title: "High Councilor Assignments to YW", url: `${HB}/6-stake-leadership?lang=eng#title_number31` },
  ],
  stakePrimary: [
    { section: "12.3.4", title: "Stake Primary Presidency", url: `${HB}/12-primary?lang=eng#title_number14` },
  ],
  stakeSS: [
    { section: "13.3.3", title: "Stake Sunday School Presidency", url: `${HB}/13-sunday-school?lang=eng#title_number11` },
  ],
  bishop: [
    { section: "7.1", title: "The Bishop — Unique Responsibilities", url: `${HB}/7?lang=eng#title_number3` },
    { section: "7.1.1", title: "Presiding High Priest", url: `${HB}/7?lang=eng#title_number4` },
    { section: "7.1.2", title: "President of the Aaronic Priesthood", url: `${HB}/7?lang=eng#title_number5` },
    { section: "7.1.3", title: "Common Judge", url: `${HB}/7?lang=eng#title_number6` },
    { section: "7.2", title: "Coordinating Work of Salvation & Exaltation", url: `${HB}/7?lang=eng#title_number8` },
  ],
  bishopC1: [
    { section: "7.3", title: "Bishopric Counselors", url: `${HB}/7?lang=eng#title_number15` },
    { section: "7.1.2", title: "Aaronic Priesthood Responsibility", url: `${HB}/7?lang=eng#title_number5` },
  ],
  bishopC2: [
    { section: "7.3", title: "Bishopric Counselors", url: `${HB}/7?lang=eng#title_number15` },
    { section: "7.1.2", title: "Aaronic Priesthood Responsibility", url: `${HB}/7?lang=eng#title_number5` },
  ],
  wardClerk: [
    { section: "7.4", title: "Ward Clerk", url: `${HB}/7?lang=eng#title_number17` },
    { section: "33.4.2", title: "Ward Clerk — Records", url: `${HB}/33-records-and-reports?lang=eng` },
  ],
  execSec: [
    { section: "7.5", title: "Ward Executive Secretary", url: `${HB}/7?lang=eng#title_number19` },
  ],
  eqPres: [
    { section: "8.3.3", title: "Elders Quorum Presidency", url: `${HB}/8-elders-quorum?lang=eng#title_number10` },
    { section: "8.2.3", title: "Sharing the Gospel", url: `${HB}/8-elders-quorum?lang=eng#title_number6` },
    { section: "8.2.4", title: "Temple & Family History", url: `${HB}/8-elders-quorum?lang=eng#title_number7` },
    { section: "21.2", title: "Ministering — Organizing", url: `${HB}/21-ministering?lang=eng#title_number4` },
  ],
  eqC1: [
    { section: "8.3.3.2", title: "EQ Counselors", url: `${HB}/8-elders-quorum?lang=eng#title_number12` },
    { section: "23.6.3", title: "EQ & RS in Missionary Work", url: `${HB}/23?lang=eng#title_number22` },
    { section: "23.4", title: "Weekly Missionary Coordination", url: `${HB}/23?lang=eng#title_number17` },
  ],
  eqC2: [
    { section: "8.3.3.2", title: "EQ Counselors", url: `${HB}/8-elders-quorum?lang=eng#title_number12` },
    { section: "25.2.2", title: "EQ & RS in Temple & FH", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number5` },
    { section: "25.4", title: "T&FH Coordination Meetings", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number12` },
  ],
  rsPres: [
    { section: "9.3.2", title: "Relief Society Presidency", url: `${HB}/9-relief-society?lang=eng#title_number12` },
    { section: "9.2.3", title: "RS — Sharing the Gospel", url: `${HB}/9-relief-society?lang=eng#title_number6` },
    { section: "9.2.4", title: "RS — Temple & Family History", url: `${HB}/9-relief-society?lang=eng#title_number7` },
    { section: "21.2", title: "Ministering — Organizing", url: `${HB}/21-ministering?lang=eng#title_number4` },
  ],
  rsC1: [
    { section: "9.3.2.2", title: "RS Counselors", url: `${HB}/9-relief-society?lang=eng#title_number13` },
    { section: "23.6.3", title: "EQ & RS in Missionary Work", url: `${HB}/23?lang=eng#title_number22` },
  ],
  rsC2: [
    { section: "9.3.2.2", title: "RS Counselors", url: `${HB}/9-relief-society?lang=eng#title_number13` },
    { section: "25.2.2", title: "EQ & RS in Temple & FH", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number5` },
  ],
  ywPres: [
    { section: "11.3.2", title: "Young Women Presidency", url: `${HB}/11-young-women?lang=eng#title_number10` },
    { section: "11.2", title: "YW — Work of Salvation", url: `${HB}/11-young-women?lang=eng#title_number4` },
  ],
  ywC1: [
    { section: "11.3.2.2", title: "YW Counselors", url: `${HB}/11-young-women?lang=eng#title_number12` },
  ],
  ywC2: [
    { section: "11.3.2.2", title: "YW Counselors", url: `${HB}/11-young-women?lang=eng#title_number12` },
  ],
  primaryPres: [
    { section: "12.3.2", title: "Primary Presidency", url: `${HB}/12-primary?lang=eng#title_number10` },
    { section: "12.2", title: "Primary — Work of Salvation", url: `${HB}/12-primary?lang=eng#title_number4` },
  ],
  primaryC1: [
    { section: "12.3.2.2", title: "Primary Counselors", url: `${HB}/12-primary?lang=eng#title_number12` },
  ],
  primaryC2: [
    { section: "12.3.2.2", title: "Primary Counselors", url: `${HB}/12-primary?lang=eng#title_number12` },
  ],
  ssPres: [
    { section: "13.3.2", title: "Sunday School Presidency", url: `${HB}/13-sunday-school?lang=eng#title_number9` },
    { section: "13.4", title: "Improving Teaching", url: `${HB}/13-sunday-school?lang=eng#title_number14` },
    { section: "17.4", title: "Teacher Council Meetings", url: `${HB}/17-teaching-the-gospel?lang=eng#title_number8` },
  ],
  ssC1: [
    { section: "13.3.2.2", title: "SS Counselors", url: `${HB}/13-sunday-school?lang=eng#title_number10` },
  ],
  ssC2: [
    { section: "13.3.2.2", title: "SS Counselors", url: `${HB}/13-sunday-school?lang=eng#title_number10` },
  ],
  wardMissionLeader: [
    { section: "23.6.4", title: "Ward Mission Leader", url: `${HB}/23?lang=eng#title_number23` },
    { section: "23.4", title: "Weekly Coordination Meetings", url: `${HB}/23?lang=eng#title_number17` },
  ],
  templeFHLeader: [
    { section: "25.2.4", title: "Ward Temple & FH Leader", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number7` },
    { section: "25.4", title: "T&FH Coordination Meetings", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number12` },
  ],
};

// Handbook references per meeting
const MEETING_REFS = {
  sacramentMeeting: [
    { section: "29.2.2", title: "Sacrament Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number6` },
    { section: "18.9", title: "Sacrament Ordinance", url: `${HB}/18-priesthood-ordinances-and-blessings?lang=eng#title_number46` },
  ],
  bishopricMeeting: [
    { section: "29.2.3", title: "Bishopric Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number8` },
  ],
  wardCouncil: [
    { section: "29.2.5", title: "Ward Council Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number10` },
    { section: "4.4", title: "Councils in the Church", url: `${HB}/4-leadership-and-councils?lang=eng#title_number13` },
  ],
  wardYouthCouncil: [
    { section: "29.2.6", title: "Ward Youth Council Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number11` },
  ],
  missionaryCoord: [
    { section: "23.4", title: "Weekly Coordination Meetings", url: `${HB}/23?lang=eng#title_number17` },
    { section: "23.6", title: "Roles of Ward Leaders", url: `${HB}/23?lang=eng#title_number20` },
  ],
  templeFHCoord: [
    { section: "25.4", title: "Temple & FH Coordination Meetings", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number12` },
    { section: "25.2", title: "Ward Leaders' Responsibilities", url: `${HB}/25-temple-and-family-history-work?lang=eng#title_number3` },
  ],
  eqPresidency: [
    { section: "8.3.4", title: "EQ Presidency Meeting", url: `${HB}/8-elders-quorum?lang=eng#title_number14` },
    { section: "29.2.7", title: "Presidency Meetings", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number12` },
  ],
  rsPresidency: [
    { section: "9.3.4", title: "RS Presidency Meeting", url: `${HB}/9-relief-society?lang=eng#title_number15` },
    { section: "29.2.7", title: "Presidency Meetings", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number12` },
  ],
  ywPresidency: [
    { section: "11.3.3", title: "YW Presidency Meeting", url: `${HB}/11-young-women?lang=eng#title_number14` },
    { section: "29.2.7", title: "Presidency Meetings", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number12` },
  ],
  primaryPresidency: [
    { section: "12.3.3", title: "Primary Presidency Meeting", url: `${HB}/12-primary?lang=eng#title_number13` },
    { section: "29.2.7", title: "Presidency Meetings", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number12` },
  ],
  teacherCouncil: [
    { section: "17.4", title: "Teacher Council Meetings", url: `${HB}/17-teaching-the-gospel?lang=eng#title_number8` },
    { section: "13.4", title: "Improving Learning and Teaching", url: `${HB}/13-sunday-school?lang=eng#title_number14` },
  ],
  highCouncilMeeting: [
    { section: "29.3.3", title: "High Council Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number20` },
    { section: "6.5", title: "High Council", url: `${HB}/6-stake-leadership?lang=eng#title_number31` },
  ],
  stakeCouncil: [
    { section: "29.3.4", title: "Stake Council Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number21` },
    { section: "4.4.3", title: "Stake Council", url: `${HB}/4-leadership-and-councils?lang=eng#title_number17` },
  ],
  stakeConference: [
    { section: "29.3.1", title: "Stake Conference", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number18` },
  ],
  stakePriesthoodLeadership: [
    { section: "29.3.2", title: "Stake Priesthood Leadership Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number19` },
  ],
};

// Handbook references per responsibility area
const RESP_REFS = {
  livingGospel: [
    { section: "1.2.1", title: "Living the Gospel of Jesus Christ", url: `${HB}/1-work-of-salvation-and-exaltation?lang=eng#title_number4` },
    { section: "16", title: "Living the Gospel — Full Chapter", url: `${HB}/16-living-the-gospel?lang=eng` },
  ],
  caringForNeedy: [
    { section: "1.2.2", title: "Caring for Those in Need", url: `${HB}/1-work-of-salvation-and-exaltation?lang=eng#title_number5` },
    { section: "22", title: "Temporal Needs & Self-Reliance", url: `${HB}/22-providing-for-temporal-needs?lang=eng` },
    { section: "21", title: "Ministering", url: `${HB}/21-ministering?lang=eng` },
  ],
  missionary: [
    { section: "1.2.3", title: "Inviting All to Receive the Gospel", url: `${HB}/1-work-of-salvation-and-exaltation?lang=eng#title_number6` },
    { section: "23", title: "Sharing the Gospel — Full Chapter", url: `${HB}/23?lang=eng` },
  ],
  templeFH: [
    { section: "1.2.4", title: "Uniting Families for Eternity", url: `${HB}/1-work-of-salvation-and-exaltation?lang=eng#title_number7` },
    { section: "25", title: "Temple & Family History — Full Chapter", url: `${HB}/25-temple-and-family-history-work?lang=eng` },
  ],
  ministering: [
    { section: "21", title: "Ministering — Full Chapter", url: `${HB}/21-ministering?lang=eng` },
    { section: "21.2", title: "Organizing Ministering", url: `${HB}/21-ministering?lang=eng#title_number4` },
  ],
  youthDev: [
    { section: "10", title: "Aaronic Priesthood Quorums", url: `${HB}/10-aaronic-priesthood?lang=eng` },
    { section: "11", title: "Young Women", url: `${HB}/11-young-women?lang=eng` },
    { section: "12", title: "Primary", url: `${HB}/12-primary?lang=eng` },
  ],
  worship: [
    { section: "29.2.2", title: "Sacrament Meeting", url: `${HB}/29-meetings-in-the-church?lang=eng#title_number6` },
    { section: "17", title: "Teaching the Gospel", url: `${HB}/17-teaching-the-gospel?lang=eng` },
    { section: "13", title: "Sunday School", url: `${HB}/13-sunday-school?lang=eng` },
  ],
  recordsFinance: [
    { section: "33", title: "Records and Reports", url: `${HB}/33-records-and-reports?lang=eng` },
    { section: "34", title: "Finances and Audits", url: `${HB}/34-finances-and-audits?lang=eng` },
  ],
};

// Group positions for calling view — keeps presidencies tight
const GROUP_POS = {
  stake: { cx: 0, cy: -200 },
  bishopric: { cx: 0, cy: -60 },
  eq: { cx: -200, cy: 100 },
  rs: { cx: -20, cy: 100 },
  yw: { cx: 160, cy: 100 },
  primary: { cx: 320, cy: 100 },
  ss: { cx: -370, cy: 100 },
  support: { cx: -110, cy: 230 },
};

const compactAssignedName = (fullName, maxLength = 20) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, maxLength);
  const compact = `${parts[0]} ${parts[parts.length - 1]}`;
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 1)}…`;
};

const assignmentLinesForRole = (assignments, roleId) => {
  const members = assignments?.[roleId]?.members || [];
  if (members.length === 0) return [];
  if (members.length === 1) return [compactAssignedName(members[0].fullName, 18)];
  if (members.length === 2) return members.map((member) => compactAssignedName(member.fullName, 18));
  return [compactAssignedName(members[0].fullName, 18), `+${members.length - 1} more`];
};

const shapeMetricsForRole = (assignments, roleId, radius) => {
  const lineCount = assignmentLinesForRole(assignments, roleId).length;
  return {
    rx: Math.max(radius * 2.15, 46),
    ry: radius + 14 + lineCount * 9,
    titleDy: lineCount > 0 ? -9 : 2,
    assignmentStartDy: 11
  };
};

const buildMailtoHref = (emails, subject) => {
  const unique = Array.from(new Set((emails || []).filter(Boolean)));
  if (unique.length === 0) return null;
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  return `mailto:?bcc=${encodeURIComponent(unique.join(","))}${params.toString() ? `&${params.toString()}` : ""}`;
};

const buildSmsHref = (numbers) => {
  const unique = Array.from(new Set((numbers || []).filter(Boolean)));
  if (unique.length === 0) return null;
  return `sms:${unique.join(",")}`;
};

// ═══════════════════════════════════════════════════════════════
// D3 FORCE GRAPH COMPONENT — Imperative for performance
// ═══════════════════════════════════════════════════════════════

function ForceGraph({ view, respFilter, expandedMeeting, selected, onSelect, onDetail, width, height, assignments }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const zoomRef = useRef(null);
  const gRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // Build node/link data for current view
  const graphData = useMemo(() => {
    if (view === "calling") {
      const nodes = Object.keys(C).map(id => {
        const c = C[id];
        const gp = GROUP_POS[c.group] || { cx: 0, cy: 0 };
        const isPresident = c.short.includes("Pres.") || id === "bishop";
        const isCounselor = c.short.includes("C.") || c.short.includes("Clerk") || c.short.includes("Sec.");
        const shape = shapeMetricsForRole(assignments, id, c.radius);
        return { id, ...c, _targetX: gp.cx, _targetY: gp.cy + (isPresident ? -30 : isCounselor ? 30 : 0), _collisionR: Math.max(shape.rx, shape.ry) + 18, _shapeRx: shape.rx, _shapeRy: shape.ry, _titleDy: shape.titleDy };
      });
      const links = [];
      Object.keys(C).forEach(id => {
        const c = C[id];
        // Reporting: child → parent (arrow points to parent)
        if (c.reportsTo && C[c.reportsTo]) links.push({ source: id, target: c.reportsTo, type: "report" });
        // Stake support: stake → ward (arrow points FROM stake TO ward)
        if (c.stakeReport && C[c.stakeReport]) links.push({ source: c.stakeReport, target: id, type: "stake" });
        // Coordination: bidirectional working relationship (dashed, double arrows)
        if (c.worksWith) c.worksWith.forEach(wid => {
          if (C[wid]) links.push({ source: id, target: wid, type: "coordination" });
        });
      });
      return { nodes, links };
    }

    if (view === "responsibility") {
      const ids = Object.keys(C).filter(id => (C[id].responsibilities || []).includes(respFilter));
      const nodes = ids.map(id => {
        const c = C[id];
        const shape = shapeMetricsForRole(assignments, id, c.radius);
        return { id, ...c, _targetX: 0, _targetY: c.level === "stake" ? -150 : id === "bishop" ? -40 : c.radius >= 17 ? 60 : c.radius >= 13 ? 150 : 200, _collisionR: Math.max(shape.rx, shape.ry) + 20, _shapeRx: shape.rx, _shapeRy: shape.ry, _titleDy: shape.titleDy };
      });
      const nodeSet = new Set(ids);
      const links = [];
      ids.forEach(id => {
        if (C[id].reportsTo && nodeSet.has(C[id].reportsTo)) links.push({ source: id, target: C[id].reportsTo, type: "report" });
        if (C[id].stakeReport && nodeSet.has(C[id].stakeReport)) links.push({ source: C[id].stakeReport, target: id, type: "stake" });
        if (C[id].worksWith) C[id].worksWith.forEach(wid => {
          if (nodeSet.has(wid)) links.push({ source: id, target: wid, type: "coordination" });
        });
      });
      return { nodes, links };
    }

    if (view === "meeting") {
      const nodes = Object.keys(MEETINGS).map(id => {
        const m = MEETINGS[id];
        const isStake = ["highCouncilMeeting","stakeCouncil","stakeConference","stakePriesthoodLeadership"].includes(id);
        return { id, ...m, radius: 32, _expandedR: 32, _isExpanded: false,
          _targetX: 0, _targetY: isStake ? -140 : 0,
          _collisionR: 62, _isMeeting: true, level: isStake ? "stake" : "ward" };
      });
      // Shared attendee links
      const mIds = Object.keys(MEETINGS);
      const links = [];
      const done = new Set();
      for (let i = 0; i < mIds.length; i++) {
        for (let j = i + 1; j < mIds.length; j++) {
          const shared = MEETINGS[mIds[i]].attendees.filter(a => MEETINGS[mIds[j]].attendees.includes(a));
          if (shared.length > 0) {
            const key = [mIds[i], mIds[j]].sort().join("-");
            if (!done.has(key)) { done.add(key); links.push({ source: mIds[i], target: mIds[j], type: "shared", _count: shared.length }); }
          }
        }
      }
      return { nodes, links };
    }
    return { nodes: [], links: [] };
  }, [assignments, view, respFilter]);

  // Init and update simulation
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!gRef.current) {
      const g = svg.append("g").attr("class", "graph-container");
      gRef.current = g;
      // Zoom — touchDelay 0 so taps don't get blocked
      const zoom = d3.zoom().scaleExtent([0.3, 3])
        .filter(event => {
          // Allow all wheel/pinch events, but for touch/mouse only allow if not on a node
          if (event.type === "wheel") return true;
          if (event.type === "touchstart" || event.type === "mousedown") {
            // Let d3-drag handle events on nodes; zoom handles empty space
            return !event.target.closest(".cnode, .mnode");
          }
          return true;
        })
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });
      svg.call(zoom);
      zoomRef.current = zoom;
      svg.on("dblclick.zoom", null);
    }

    const g = gRef.current;

    // Reset zoom to center — smaller scale on mobile
    const isMobile = width < 600;
    const initialScale = isMobile ? 0.6 : 0.85;
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(initialScale);
    d3.select(svgRef.current).call(zoomRef.current.transform, initialTransform);

    // Copy data (D3 mutates)
    const nodes = graphData.nodes.map(n => ({ ...n, x: n._targetX + (Math.random() - 0.5) * 40, y: n._targetY + (Math.random() - 0.5) * 40 }));
    const links = graphData.links.map(l => ({ ...l }));
    nodesRef.current = nodes;
    linksRef.current = links;

    // Build simulation
    if (simRef.current) simRef.current.stop();
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.type === "stake" ? 120 : d.type === "shared" ? 160 : d.type === "coordination" ? 90 : 80).strength(d => d.type === "shared" ? 0.05 : d.type === "coordination" ? 0.12 : 0.2))
      .force("charge", d3.forceManyBody().strength(d => d._isMeeting ? -250 : -200))
      .force("collide", d3.forceCollide().radius(d => d._collisionR || d.radius + 15).strength(0.7).iterations(3))
      .force("x", d3.forceX().x(d => d._targetX).strength(0.03))
      .force("y", d3.forceY().y(d => d._targetY).strength(0.04))
      .alphaDecay(0.03)
      .velocityDecay(0.65);
    simRef.current = sim;

    // ─── DRAW ────────────────────────────────────────────

    // Defs
    g.selectAll("defs").remove();
    const defs = g.append("defs");

    // Arrow markers
    [["arrow","#475569",0.5,8], ["arrow-hl","#93c5fd",1,9], ["bidi","#475569",0.35,7], ["bidi-hl","#93c5fd",0.8,8],
     ["coord","#34d399",0.6,7], ["coord-hl","#6ee7b7",0.9,8],
     ["stake-dot","#f59e0b",0.7,6], ["stake-dot-hl","#fbbf24",1,7]].forEach(([id,fill,op,sz]) => {
      defs.append("marker").attr("id",id).attr("viewBox","0 0 10 6").attr("refX",10).attr("refY",3)
        .attr("markerWidth",sz).attr("markerHeight",sz*0.7).attr("orient","auto-start-reverse")
        .append("path").attr("d","M0,0 L10,3 L0,6 Z").attr("fill",fill).attr("fill-opacity",op);
    });

    // Glow filters
    const glow = defs.append("filter").attr("id","glow"); glow.append("feGaussianBlur").attr("stdDeviation",4).attr("result","b");
    const m1 = glow.append("feMerge"); m1.append("feMergeNode").attr("in","b"); m1.append("feMergeNode").attr("in","SourceGraphic");

    // Links — for meeting view, use two paths per link (forward + reverse crawl)
    g.selectAll(".link-group").remove();
    const linkG = g.append("g").attr("class", "link-group");

    if (view === "meeting") {
      // Forward crawling path
      const linkFwd = linkG.selectAll("path.link-fwd").data(links).enter().append("path").attr("class", "link-fwd")
        .attr("fill", "none").attr("stroke", "#334155").attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "8,6").attr("stroke-opacity", 0.5)
        .style("animation", "crawlFwd 3s linear infinite");
      // Reverse crawling path (offset curve for visual separation)
      const linkRev = linkG.selectAll("path.link-rev").data(links).enter().append("path").attr("class", "link-rev")
        .attr("fill", "none").attr("stroke", "#334155").attr("stroke-width", 1.2)
        .attr("stroke-dasharray", "8,6").attr("stroke-opacity", 0.35)
        .style("animation", "crawlRev 3.5s linear infinite");
      // Combine both sets for tick updates
      var linkEls = linkFwd;
      var linkElsRev = linkRev;
    } else if (view === "responsibility") {
      // Responsibility view — animated links per type
      const linkEls_ = linkG.selectAll("path.link-resp").data(links).enter().append("path")
        .attr("class", d => `link-resp link-${d.type}`)
        .attr("fill", "none")
        .attr("stroke", d => d.type === "stake" ? "#f59e0b" : d.type === "coordination" ? "#34d399" : "#38bdf8")
        .attr("stroke-width", d => d.type === "stake" ? 2 : d.type === "coordination" ? 1.5 : 2)
        .attr("stroke-dasharray", d => d.type === "stake" ? "3,9" : d.type === "coordination" ? "8,5" : "10,5")
        .attr("stroke-linecap", d => d.type === "stake" ? "round" : "butt")
        .attr("stroke-opacity", d => d.type === "stake" ? 0.7 : 0.6)
        .attr("marker-end", d => d.type === "coordination" ? "url(#coord)" : d.type === "stake" ? "url(#stake-dot)" : "url(#arrow)")
        .attr("marker-start", d => d.type === "coordination" ? "url(#coord)" : "none")
        .style("animation", d =>
          d.type === "report" ? "crawlReport 2s linear infinite" :
          d.type === "stake" ? "crawlDots 1.5s linear infinite" :
          d.type === "coordination" ? "pingPong 3s ease-in-out infinite" :
          "none"
        );
      var linkEls = linkEls_;
      var linkElsRev = null;
    } else {
      // Calling view — same animated styles as responsibility
      const linkEls_ = linkG.selectAll("path.link-main").data(links).enter().append("path")
        .attr("class", d => `link-main link-${d.type}`)
        .attr("fill", "none")
        .attr("stroke", d => d.type === "stake" ? "#f59e0b" : d.type === "coordination" ? "#34d399" : "#38bdf8")
        .attr("stroke-width", d => d.type === "stake" ? 2 : d.type === "coordination" ? 1.5 : 2)
        .attr("stroke-dasharray", d => d.type === "stake" ? "3,9" : d.type === "coordination" ? "8,5" : "10,5")
        .attr("stroke-linecap", d => d.type === "stake" ? "round" : "butt")
        .attr("stroke-opacity", d => d.type === "stake" ? 0.7 : 0.6)
        .attr("marker-end", d => d.type === "coordination" ? "url(#coord)" : d.type === "stake" ? "url(#stake-dot)" : "url(#arrow)")
        .attr("marker-start", d => d.type === "coordination" ? "url(#coord)" : "none")
        .style("animation", d =>
          d.type === "report" ? "crawlReport 2s linear infinite" :
          d.type === "stake" ? "crawlDots 1.5s linear infinite" :
          d.type === "coordination" ? "pingPong 3s ease-in-out infinite" :
          "none"
        );
      var linkEls = linkEls_;
      var linkElsRev = null;
    }

    // Nodes
    g.selectAll(".node-group").remove();
    const nodeG = g.append("g").attr("class", "node-group");

    if (view === "meeting") {
      // Meeting nodes — always drawn collapsed, expansion handled by separate effect
      const nodeEls = nodeG.selectAll("g.mnode").data(nodes, d => d.id).enter().append("g").attr("class", "mnode")
        .style("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); onSelect(d.id); });

      // Background circle
      nodeEls.append("circle").attr("class", "bg-circle")
        .attr("r", 32)
        .attr("fill", d => getMeetingBubbleFill(d.color || d.bg || "#334155"))
        .attr("stroke", d => d.color).attr("stroke-width", 1.6)
        .attr("stroke-opacity", 0.65);

      // Title
      nodeEls.append("text").attr("class", "mtitle")
        .attr("text-anchor", "middle").attr("dy", 0)
        .attr("fill", d => getBubbleTitleColor(d.color || d.bg || "#334155")).attr("font-size", 9)
        .attr("font-weight", 700).attr("font-family", "'Outfit', sans-serif")
        .style("pointer-events", "none")
        .text(d => d.short);

      // Freq label
      nodeEls.append("text").attr("class", "freq-label")
        .attr("text-anchor", "middle").attr("dy", 13).attr("fill", d => getBubbleSecondaryTextColor(d.color || d.bg || "#334155")).attr("font-size", 7)
        .attr("font-family", "'Outfit', sans-serif").style("pointer-events", "none")
        .text(d => d.freq);

      // Stake label
      nodeEls.filter(d => d.level === "stake").append("text")
        .attr("text-anchor", "middle").attr("dy", -38)
        .attr("fill", "#6d28d9").attr("font-size", 7).attr("font-weight", 700).attr("letter-spacing", 1.2)
        .attr("font-family", "'Outfit', sans-serif").style("pointer-events", "none").text("STAKE");

      // Drag for meeting nodes — tap-aware for mobile
      const drag = d3.drag()
        .on("start", (event, d) => {
          d._dragStart = { x: event.x, y: event.y, time: Date.now() };
          d._didDrag = false;
          if (!event.active) sim.alphaTarget(0.05).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          const dx = event.x - d._dragStart.x, dy = event.y - d._dragStart.y;
          if (Math.sqrt(dx*dx + dy*dy) > 5) d._didDrag = true;
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          if (!d._didDrag && (Date.now() - d._dragStart.time) < 400) {
            onSelect(d.id);
          } else {
            d._targetX = d.x; d._targetY = d.y;
          }
          d.fx = null; d.fy = null;
        });
      nodeEls.call(drag);

    } else {
      // Calling/Responsibility nodes
      const nodeEls = nodeG.selectAll("g.cnode").data(nodes, d => d.id).enter().append("g").attr("class", "cnode")
        .style("cursor", "pointer")
        .on("click", (event, d) => { event.stopPropagation(); onSelect(d.id); });

      nodeEls.append("ellipse").attr("class", "node-ring").attr("rx", d => d._shapeRx + 5).attr("ry", d => d._shapeRy + 5)
        .attr("fill", "none").attr("stroke", d => d.color).attr("stroke-width", 0).attr("stroke-opacity", 0);

      nodeEls.append("ellipse").attr("class", "node-circle").attr("rx", d => d._shapeRx).attr("ry", d => d._shapeRy)
        .attr("fill", d => getCallingBubbleFill(d.color || "#64748b")).attr("stroke", d => d.color).attr("stroke-width", 1.8);

      nodeEls.append("text").attr("text-anchor", "middle").attr("dy", d => d._titleDy)
        .attr("fill", d => getBubbleTitleColor(d.color || "#64748b")).attr("font-size", d => d.radius >= 20 ? 13.5 : d.radius >= 14 ? 12 : 10.5)
        .attr("font-weight", 600).attr("font-family", "'Outfit', sans-serif")
        .style("pointer-events", "none")
        .text(d => d.short);

      nodeEls.each(function(d) {
        const lines = assignmentLinesForRole(assignments, d.id);
        if (lines.length === 0) return;
        const label = d3.select(this).append("text")
          .attr("class", "assignment-text")
          .attr("text-anchor", "middle")
          .attr("fill", getBubbleSecondaryTextColor(d.color || "#64748b"))
          .attr("font-size", d.radius >= 20 ? 10.5 : d.radius >= 14 ? 9.5 : 8.5)
          .attr("font-weight", 500)
          .attr("font-family", "'Outfit', sans-serif")
          .style("pointer-events", "none");

        lines.forEach((line, index) => {
          label.append("tspan")
            .attr("x", 0)
            .attr("dy", index === 0 ? d.assignmentStartDy ?? 10 : 9)
            .text(line);
        });
      });

      nodeEls.filter(d => d.level === "stake").append("text")
        .attr("text-anchor", "middle").attr("dy", d => -(d._shapeRy + 8))
        .attr("fill", "#6d28d9").attr("font-size", 7).attr("font-weight", 700).attr("letter-spacing", 1.2)
        .attr("font-family", "'Outfit', sans-serif").style("pointer-events", "none").text("STAKE");

      // Drag — tap-aware for mobile
      const drag = d3.drag()
        .on("start", (event, d) => {
          d._dragStart = { x: event.x, y: event.y, time: Date.now() };
          d._didDrag = false;
          if (!event.active) sim.alphaTarget(0.05).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          const dx = event.x - d._dragStart.x, dy = event.y - d._dragStart.y;
          if (Math.sqrt(dx*dx + dy*dy) > 5) d._didDrag = true;
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          if (!d._didDrag && (Date.now() - d._dragStart.time) < 400) {
            onSelect(d.id);
          } else {
            d._targetX = d.x; d._targetY = d.y;
          }
          d.fx = null; d.fy = null;
        });
      nodeEls.call(drag);

      // Hover
      nodeEls.on("mouseenter", function(event, d) {
        d3.select(this).select(".node-ring").attr("stroke-width", 1.5).attr("stroke-opacity", 0.3);
        d3.select(this).select(".node-circle").attr("filter", "url(#glow)");
      }).on("mouseleave", function() {
        d3.select(this).select(".node-ring").attr("stroke-width", 0).attr("stroke-opacity", 0);
        d3.select(this).select(".node-circle").attr("filter", "none");
      });
    }

    // ─── TICK ────────────────────────────────────────────
    const curvePath = (d, offset) => {
      const s = d.source, t = d.target;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const sr = (s._isExpanded ? s._expandedR : s.radius) || 16;
      const tr = (t._isExpanded ? t._expandedR : t.radius) || 16;
      const perpX = -dy / dist, perpY = dx / dist;
      const mx = (s.x + t.x) / 2 + perpX * offset;
      const my = (s.y + t.y) / 2 + perpY * offset;
      const pad = d.type === "shared" ? 4 : d.type === "coordination" ? 4 : 10;
      const sx = s.x + (dx / dist) * (sr + 2);
      const sy = s.y + (dy / dist) * (sr + 2);
      const tx = t.x - (dx / dist) * (tr + pad);
      const ty = t.y - (dy / dist) * (tr + pad);
      return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
    };

    sim.on("tick", () => {
      // Forward paths
      linkEls.attr("d", d => curvePath(d, view === "meeting" ? 12 : 18));
      // Reverse paths (meeting view only — opposite curve)
      if (linkElsRev) linkElsRev.attr("d", d => curvePath(d, -12));

      // Update node positions
      if (view === "meeting") {
        nodeG.selectAll("g.mnode").attr("transform", d => `translate(${d.x},${d.y})`);
      } else {
        nodeG.selectAll("g.cnode").attr("transform", d => `translate(${d.x},${d.y})`);
      }
    });

    return () => { if (simRef.current) simRef.current.stop(); };
  }, [assignments, graphData, width, height, view, onSelect, onDetail]);

  // Handle meeting expansion smoothly within running simulation
  useEffect(() => {
    if (view !== "meeting" || !simRef.current || !gRef.current) return;
    const sim = simRef.current;
    const nodes = nodesRef.current;
    const g = gRef.current;

    // Update all nodes' expansion state
    nodes.forEach(d => {
      const isExp = expandedMeeting === d.id;
      const targetR = isExp ? Math.max(80, (d.attendees || []).length * 18) : 32;
      d._isExpanded = isExp;
      d._expandedR = targetR;
      d._collisionR = targetR + 30;
    });

    // Update collide force with new radii
    sim.force("collide", d3.forceCollide().radius(d => d._collisionR || d.radius + 15).strength(0.7).iterations(3));

    // Gently reheat — low alpha for smooth push
    sim.alpha(0.15).restart();

    // Update SVG elements
    g.selectAll("g.mnode").each(function(d) {
      const el = d3.select(this);
      const isExp = d._isExpanded;
      const r = isExp ? d._expandedR : 32;

      // Animate bg circle
      el.select(".bg-circle")
        .transition().duration(600).ease(d3.easeCubicOut)
        .attr("r", r)
        .attr("stroke-width", isExp ? 2 : 1.5)
        .attr("stroke-opacity", isExp ? 0.8 : 0.5);

      // Move title
      el.select(".mtitle")
        .transition().duration(600).ease(d3.easeCubicOut)
        .attr("dy", isExp ? -(r - 12) : 0)
        .attr("fill", getBubbleTitleColor(d.color || d.bg || "#334155"))
        .attr("font-size", isExp ? 10 : 9);

      // Show/hide freq label
      el.selectAll(".freq-label")
        .transition().duration(300)
        .attr("opacity", isExp ? 0 : 1);

      // Remove old attendees
      el.selectAll(".att-node").remove();

      // Add attendees if expanded
      if (isExp) {
        const atts = (d.attendees || []).map(id => C[id]).filter(Boolean);
        const angleStep = atts.length > 0 ? (2 * Math.PI) / atts.length : 0;
        const innerR = r * 0.58;
        atts.forEach((att, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const ax = Math.cos(angle) * innerR;
          const ay = Math.sin(angle) * innerR;
          const ag = el.append("g").attr("class", "att-node")
            .attr("transform", `translate(${ax},${ay}) scale(0)`)
            .style("cursor", "pointer")
            .on("click", (event) => { event.stopPropagation(); onDetail(att); })
            .on("touchend", (event) => { event.stopPropagation(); event.preventDefault(); onDetail(att); });
          const label = att.short.length > 16 ? `${att.short.substring(0, 15)}…` : att.short;
          const badgeRx = Math.max(15, Math.min(40, label.length * 2.9 + 6));
          const badgeRy = label.length > 11 ? 10.5 : 9.5;
          ag.append("ellipse")
            .attr("rx", badgeRx)
            .attr("ry", badgeRy)
            .attr("fill", getCallingBubbleFill(att.color))
            .attr("stroke", att.color)
            .attr("stroke-width", 1.4);
          ag.append("text").attr("text-anchor", "middle").attr("dy", "0.3em")
            .attr("fill", getBubbleTitleColor(att.color)).attr("font-size", label.length > 12 ? 6.1 : 6.8).attr("font-weight", 700)
            .attr("font-family", "'Outfit', sans-serif").style("pointer-events", "none")
            .text(label);
          // Staggered pop-in
          ag.transition().delay(200 + i * 50).duration(400).ease(d3.easeBackOut.overshoot(1.2))
            .attr("transform", `translate(${ax},${ay}) scale(1)`);
        });
      }
    });
  }, [expandedMeeting, view, onDetail]);

  // Handle selection highlighting
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;
    const links = linksRef.current;
    const linkedIds = new Set();
    if (selected) {
      linkedIds.add(selected);
      links.forEach(l => {
        const sid = typeof l.source === "object" ? l.source.id : l.source;
        const tid = typeof l.target === "object" ? l.target.id : l.target;
        if (sid === selected) linkedIds.add(tid);
        if (tid === selected) linkedIds.add(sid);
      });
    }

    // Highlight nodes
    if (view !== "meeting") {
      g.selectAll("g.cnode").each(function(d) {
        const el = d3.select(this);
        const isSel = d.id === selected;
        const isLinked = linkedIds.has(d.id);
        const dimmed = selected && !isLinked;
        el.select(".node-circle")
          .attr("fill", isSel ? getSelectedBubbleFill(d.color || "#64748b") : getCallingBubbleFill(d.color || "#64748b"))
          .attr("stroke-width", isSel ? 3 : 1.8)
          .attr("filter", isSel ? "url(#glow)" : "none");
        el.selectAll("text")
          .attr("opacity", dimmed ? 0.38 : 1);
        el.style("opacity", dimmed ? 0.2 : 1);
      });
    }

    // Highlight links
    g.selectAll("path").filter(function() {
      const cls = d3.select(this).attr("class") || "";
      return cls.includes("link-");
    }).each(function(d) {
      if (!d || !d.source) return;
      const sid = typeof d.source === "object" ? d.source.id : d.source;
      const tid = typeof d.target === "object" ? d.target.id : d.target;
      const isHL = selected && (sid === selected || tid === selected);
      const el = d3.select(this);
      const cls = el.attr("class") || "";

      if (view === "meeting") {
        // Meeting view — highlight connected crawling lines
        el.attr("stroke-opacity", selected && !isHL ? 0.05 : isHL ? 0.8 : cls.includes("rev") ? 0.35 : 0.5)
          .attr("stroke", isHL ? "#93c5fd" : "#334155")
          .attr("stroke-width", isHL ? 2 : 1.2);
      } else if (view === "responsibility") {
        // Responsibility view — preserve animation, adjust opacity and glow
        const isStake = d.type === "stake";
        const isCoord = d.type === "coordination";
        const baseColor = isStake ? "#f59e0b" : isCoord ? "#34d399" : "#38bdf8";
        el.attr("stroke-opacity", selected && !isHL ? 0.06 : isHL ? 1 : isStake ? 0.7 : 0.6)
          .attr("stroke", isHL ? (isCoord ? "#6ee7b7" : isStake ? "#fbbf24" : "#7dd3fc") : baseColor)
          .attr("stroke-width", isHL ? 3 : isStake ? 2 : isCoord ? 1.5 : 2)
          .attr("marker-end", isCoord ? (isHL ? "url(#coord-hl)" : "url(#coord)") : isStake ? (isHL ? "url(#stake-dot-hl)" : "url(#stake-dot)") : (isHL ? "url(#arrow-hl)" : "url(#arrow)"))
          .attr("marker-start", isCoord ? (isHL ? "url(#coord-hl)" : "url(#coord)") : "none");
      } else {
        // Calling view — same highlight colors as responsibility
        const isStake = d.type === "stake";
        const isCoord = d.type === "coordination";
        const baseColor = isStake ? "#f59e0b" : isCoord ? "#34d399" : "#38bdf8";
        el.attr("stroke-opacity", selected && !isHL ? 0.06 : isHL ? 1 : isStake ? 0.7 : 0.6)
          .attr("stroke", isHL ? (isCoord ? "#6ee7b7" : isStake ? "#fbbf24" : "#7dd3fc") : baseColor)
          .attr("stroke-width", isHL ? 3 : isStake ? 2 : isCoord ? 1.5 : 2)
          .attr("marker-end", isCoord ? (isHL ? "url(#coord-hl)" : "url(#coord)") : isStake ? (isHL ? "url(#stake-dot-hl)" : "url(#stake-dot)") : (isHL ? "url(#arrow-hl)" : "url(#arrow)"))
          .attr("marker-start", isCoord ? (isHL ? "url(#coord-hl)" : "url(#coord)") : "none");
      }
    });
  }, [selected, view]);

  return (
    <svg ref={svgRef} width={width} height={height} style={{ display: "block", background: "#f4efe3", borderRadius: 0, cursor: "grab", touchAction: "none" }}>
      <rect width={width} height={height} fill="#f4efe3" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

function RefLinks({ refs }) {
  if (!refs || refs.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Handbook References</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {refs.map((ref, i) => (
          <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 8, background: "#fffaf0",
              textDecoration: "none", transition: "background 0.2s ease",
              border: "1px solid #d9d2c3",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3ead5"}
            onMouseLeave={e => e.currentTarget.style.background = "#fffaf0"}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", minWidth: 40, fontFamily: "monospace" }}>{ref.section}</span>
            <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{ref.title}</span>
            <span style={{ fontSize: 10, color: "#64748b" }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ data, type, onClose, respFilter, isMobile, assignments, meetings, selectedUnit, loading, onCopyPhones }) {
  if (!data) return null;
  const refs = type === "calling" ? (REFS[data.id] || []) : (MEETING_REFS[data.id] || []);
  const respRefs = respFilter ? (RESP_REFS[respFilter] || []) : [];
  const gridCols = isMobile ? "1fr" : "1fr 1fr";
  const assignedPeople = type === "calling" ? (assignments?.[data.id]?.members || []) : [];
  const meetingRoster = type === "meeting" ? (meetings?.[data.id]?.attendees || []) : [];
  const roleNeedsUnit = type === "calling" && data.level !== "stake" && !selectedUnit;
  const roleEmails = assignedPeople.map(person => person.email).filter(Boolean);
  const rolePhones = assignedPeople.map(person => person.phoneNumber).filter(Boolean);
  const meetingEmails = meetingRoster.map(person => person.email).filter(Boolean);
  const meetingPhones = meetingRoster.map(person => person.phoneNumber).filter(Boolean);
  const roleMailto = buildMailtoHref(roleEmails, `${data.title} Follow-Up`);
  const meetingMailto = buildMailtoHref(meetingEmails, `${data.title} Coordination`);
  return (
    <div style={{ background: "#fffdf8", borderTop: `3px solid ${data.color || "#3b82f6"}`, borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "1px solid #d9d2c3", borderBottom: "none", padding: isMobile ? "14px 16px" : "20px 24px", color: "#1f2937", fontFamily: "'Outfit',sans-serif", animation: "panelSlide 0.3s ease", maxHeight: isMobile ? "60vh" : 480, overflow: "auto", WebkitOverflowScrolling: "touch", boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: data.color }}>{data.icon && <span style={{ marginRight: 6 }}>{data.icon}</span>}{data.title}</div>
          {data.freq && <div style={{ fontSize: 13, color: "#64748b" }}>{data.freq}{data.attendees && ` · ${data.attendees.length} attendees`}</div>}
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, maxWidth: 700, marginTop: 4 }}>{data.desc}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 22, cursor: "pointer", padding: 4 }}>✕</button>
      </div>
      {type === "calling" && (
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12, marginTop: 10 }}>
          <div>
            {data.reportsTo && C[data.reportsTo] && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Reports To</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: C[data.reportsTo].color + "20", color: C[data.reportsTo].color, fontSize: 13, fontWeight: 600 }}>↑ {C[data.reportsTo].title}</span>
                </div>
              </div>
            )}
            {data.stakeReport && C[data.stakeReport] && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Training / Support From</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: C[data.stakeReport].color + "20", color: C[data.stakeReport].color, fontSize: 13, fontWeight: 600 }}>↘ {C[data.stakeReport].title}</span>
                </div>
              </div>
            )}
            {data.worksWith && data.worksWith.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Works With</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {data.worksWith.map(wid => C[wid] && <span key={wid} style={{ padding: "2px 8px", borderRadius: 4, background: C[wid].color + "20", color: C[wid].color, fontSize: 13, fontWeight: 600 }}>↔ {C[wid].title}</span>)}
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{respFilter ? `Duties for "${RESP[respFilter]?.title}"` : "Key Responsibilities"}</div>
            {(data.keyDuties || []).map((d, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#334155", paddingLeft: 12, position: "relative", marginBottom: 1 }}>
                <span style={{ position: "absolute", left: 0, color: data.color }}>›</span>{d}
              </div>
            ))}
            {respFilter && respRefs.length > 0 && <RefLinks refs={respRefs} />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Assigned People</div>
            {loading ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>Loading assignments...</div>
            ) : roleNeedsUnit ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>Select a unit to populate ward-level leadership assignments.</div>
            ) : assignedPeople.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>No current assignment matched this handbook role.</div>
            ) : (
              <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
                {assignedPeople.map((person) => (
                  <div key={`${data.id}-${person.lcrMemberId}`} style={{ padding: 8, borderRadius: 8, background: "#fffaf0", border: "1px solid #d9d2c3" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <a href={`/members/${person.lcrMemberId}`} style={{ fontSize: 13, fontWeight: 700, color: data.color, textDecoration: "none" }}>{person.fullName}</a>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{person.callingTitle}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {person.email ? (
                          <a href={`mailto:${person.email}`} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#e0f2fe", color: "#0369a1", textDecoration: "none", fontWeight: 600 }}>{person.email}</a>
                        ) : null}
                        {person.phoneNumber ? (
                          <button onClick={() => onCopyPhones([person.phoneNumber], `Copied ${person.phoneNumber}.`)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534", textDecoration: "none", fontWeight: 600, border: "none", cursor: "pointer" }}>{person.phoneNumber}</button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(roleMailto || rolePhones.length > 0) ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {roleMailto ? (
                  <a href={roleMailto} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#0f766e", color: "#fff", textDecoration: "none", fontWeight: 700 }}>Email</a>
                ) : null}
                {rolePhones.length > 0 ? (
                  <button onClick={() => onCopyPhones(rolePhones, "Assigned phones copied.")} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#1d4ed8", color: "#fff", textDecoration: "none", fontWeight: 700, border: "none", cursor: "pointer" }}>Copy Phones</button>
                ) : null}
              </div>
            ) : null}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Meetings</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
              {(data.meetings || []).map(mid => MEETINGS[mid] && <span key={mid} style={{ padding: "2px 7px", borderRadius: 4, background: MEETINGS[mid].color + "18", color: MEETINGS[mid].color, fontSize: 12, fontWeight: 600 }}>{MEETINGS[mid].title}</span>)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Responsibility Areas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {(data.responsibilities || []).map(rid => RESP[rid] && <span key={rid} style={{ padding: "2px 7px", borderRadius: 4, background: RESP[rid].color + "18", color: RESP[rid].color, fontSize: 12, fontWeight: 600 }}>{RESP[rid].icon} {RESP[rid].title}</span>)}
            </div>
            <RefLinks refs={refs} />
          </div>
        </div>
      )}
      {type === "meeting" && (
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 12, marginTop: 10 }}>
          <div>
            <div style={{ padding: "7px 10px", borderRadius: 8, background: "#f4efe3", marginBottom: 8, fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
              <span style={{ color: "#64748b", fontWeight: 500 }}>Info Flow: </span>{data.flow}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Agenda</div>
            {(data.topics || []).map((t, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.5, color: "#334155", paddingLeft: 12, position: "relative", marginBottom: 1 }}>
                <span style={{ position: "absolute", left: 0, color: data.color }}>›</span>{t}
              </div>
            ))}
            {(meetingMailto || meetingPhones.length > 0) ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {meetingMailto ? (
                  <a href={meetingMailto} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#0f766e", color: "#fff", textDecoration: "none", fontWeight: 700 }}>Email Attendees</a>
                ) : null}
                {meetingPhones.length > 0 ? (
                  <button onClick={() => onCopyPhones(meetingPhones, "Attendee phone list copied.")} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 999, background: "#1d4ed8", color: "#fff", textDecoration: "none", fontWeight: 700, border: "none", cursor: "pointer" }}>Copy Attendee Phones</button>
                ) : null}
              </div>
            ) : null}
            <RefLinks refs={refs} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Attendees & Focus Areas</div>
            {loading ? (
              <div style={{ fontSize: 13, color: "#64748b" }}>Loading meeting roster...</div>
            ) : meetingRoster.length > 0 ? (
              meetingRoster.map((person) => {
                const cal = C[person.roleId];
                return (
                  <div key={`${person.roleId}-${person.lcrMemberId}`} style={{ marginBottom: 5, padding: 8, borderRadius: 8, background: "#fffaf0", border: `1px solid ${(cal?.color || "#94a3b8")}20` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: cal?.color || "#475569" }}>{person.roleTitle}</div>
                        <a href={`/members/${person.lcrMemberId}`} style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", textDecoration: "none" }}>{person.fullName}</a>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {person.email ? (
                          <a href={`mailto:${person.email}`} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#e0f2fe", color: "#0369a1", textDecoration: "none", fontWeight: 600 }}>{person.email}</a>
                        ) : null}
                        {person.phoneNumber ? (
                          <button onClick={() => onCopyPhones([person.phoneNumber], `Copied ${person.phoneNumber}.`)} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534", textDecoration: "none", fontWeight: 600, border: "none", cursor: "pointer" }}>{person.phoneNumber}</button>
                        ) : null}
                      </div>
                    </div>
                    {cal ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 4 }}>
                        {(cal.responsibilities || []).map(rid => RESP[rid] && <span key={rid} style={{ fontSize: 10, padding: "2px 5px", borderRadius: 3, background: RESP[rid].color + "18", color: RESP[rid].color }}>{RESP[rid].icon} {RESP[rid].title}</span>)}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              (data.attendees || []).map(cid => { const cal = C[cid]; if (!cal) return null; return (
                <div key={cid} style={{ marginBottom: 5, padding: 8, borderRadius: 8, background: "#fffaf0", border: `1px solid ${cal.color}20` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: cal.color }}>{cal.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>No current assignment mapped.</div>
                </div>
              );})
            )}
            {data.optional && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>May also: {data.optional.map(id => C[id]?.title).filter(Boolean).join(", ")}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

export default function WardGraph({ assignments = {}, meetings = {}, selectedUnit = null, loading = false }: any) {
  const [view, setView] = useState("calling");
  const [selected, setSelected] = useState(null);
  const [respFilter, setRespFilter] = useState("missionary");
  const [expandedMeeting, setExpandedMeeting] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 900, h: 750 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentRect.width;
        const isMobile = w < 600;
        setDims({ w: Math.max(320, w), h: isMobile ? 500 : 750 });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleViewChange = v => { setSelected(null); setExpandedMeeting(null); setDetailData(null); setView(v); };

  const handleSelect = useCallback((id) => {
    if (view === "meeting") {
      if (expandedMeeting === id) {
        setExpandedMeeting(null); setSelected(null); setDetailData(null);
      } else {
        setExpandedMeeting(id); setSelected(id);
        setDetailData(MEETINGS[id] ? { data: MEETINGS[id], type: "meeting" } : null);
      }
    } else {
      if (selected === id) { setSelected(null); setDetailData(null); }
      else { setSelected(id); setDetailData(C[id] ? { data: C[id], type: "calling" } : null); }
    }
  }, [view, selected, expandedMeeting]);

  const handleAttendeeDetail = useCallback((att) => {
    setSelected(att.id);
    setDetailData({ data: att, type: "calling" });
  }, []);

  const handleCopyPhones = useCallback(async (numbers, message) => {
    const unique = Array.from(new Set((numbers || []).filter(Boolean)));
    if (unique.length === 0) return;

    try {
      await navigator.clipboard.writeText(unique.join("\n"));
      setStatusMessage(message);
      window.setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      setStatusMessage("Unable to copy phone list.");
      window.setTimeout(() => setStatusMessage(null), 2500);
    }
  }, []);

  const isMobile = dims.w < 600;

  const views = [
    { id: "calling", label: isMobile ? "Callings" : "Calling Focus", icon: "👤" },
    { id: "responsibility", label: isMobile ? "Duties" : "Responsibility Focus", icon: "📋" },
    { id: "meeting", label: isMobile ? "Meetings" : "Meeting Focus", icon: "🗓" },
  ];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "linear-gradient(180deg, #fffdf8 0%, #f8f4ea 100%)", minHeight: "auto", color: "#1f2937", overflow: "hidden", border: "1px solid #d9d2c3", borderRadius: 24, boxShadow: "0 24px 64px rgba(15, 23, 42, 0.10)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes panelSlide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes crawlFwd { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -28; } }
        @keyframes crawlRev { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 28; } }
        @keyframes crawlReport { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -30; } }
        @keyframes crawlDots { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -24; } }
        @keyframes pingPong { 0% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: -26; } 100% { stroke-dashoffset: 0; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: isMobile ? "14px 14px 10px" : "18px 22px 12px", borderBottom: "1px solid #d9d2c3", background: "linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(249,245,234,0.92) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 3 }}>Visual Structure</div>
            <h1 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, letterSpacing: -0.6, color: "#1f2937" }}>Ward Organization Graph</h1>
            {!isMobile && <p style={{ fontSize: 12, color: "#64748b" }}>{selectedUnit ? `Showing mapped leadership assignments for ${selectedUnit}.` : "Showing stake-level assignments. Select a unit to populate ward leadership roles and meeting rosters."}</p>}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {views.map(v => (
              <button key={v.id} onClick={() => handleViewChange(v.id)} style={{
                padding: isMobile ? "6px 10px" : "8px 14px", borderRadius: 999, border: view === v.id ? "1px solid #0f766e" : "1px solid #d9d2c3", cursor: "pointer",
                background: view === v.id ? "#0f766e" : "#fffdf8", color: view === v.id ? "#fff" : "#475569",
                fontSize: isMobile ? 10 : 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
                boxShadow: view === v.id ? "0 8px 20px rgba(15, 118, 110, 0.18)" : "none"
              }}>{v.icon} {v.label}</button>
            ))}
          </div>
        </div>
        {view === "responsibility" && (
          <div style={{ display: "flex", gap: 6, padding: "10px 0 2px", flexWrap: "wrap", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
            {Object.values(RESP).map(r => (
              <button key={r.id} onClick={() => { setRespFilter(r.id); setSelected(null); setDetailData(null); }} style={{
                padding: isMobile ? "4px 8px" : "6px 11px", borderRadius: 999, border: respFilter === r.id ? `1px solid ${r.color}` : "1px solid #d9d2c3", cursor: "pointer",
                background: respFilter === r.id ? r.color : "#fffaf0", color: respFilter === r.id ? "#fff" : "#475569",
                fontSize: isMobile ? 9 : 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif", transition: "all 0.2s",
                boxShadow: respFilter === r.id ? `0 10px 18px ${r.color}26` : "none", whiteSpace: "nowrap",
              }}>{r.icon} {isMobile ? r.title.split(" ")[0] : r.title}</button>
            ))}
          </div>
        )}
        {!isMobile && <div style={{ padding: "8px 0 2px", fontSize: 11, color: "#64748b" }}>
          {view === "calling" && "Blue dashes → reporting flow ↑ · Amber dots → stake instruction ↓ · Green ping-pong → works with ↔ · Assigned names appear below each mapped role."}
          {view === "responsibility" && "Select an area. Animated lines show info flow direction. Dots = stake instruction. Ping-pong = coordination."}
          {view === "meeting" && "Click meeting to expand attendees inside · Click attendee for their focus areas · Drag & zoom"}
        </div>}
        {statusMessage ? <div style={{ paddingTop: 6, fontSize: 11, color: "#0f766e", fontWeight: 700 }}>{statusMessage}</div> : null}
      </div>

      {/* GRAPH */}
      <div style={{ padding: isMobile ? 10 : 16 }}>
        <div ref={containerRef} style={{ width: "100%", height: dims.h, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(15, 23, 42, 0.12)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
        <ForceGraph
          view={view}
          respFilter={respFilter}
          expandedMeeting={expandedMeeting}
          selected={selected}
          onSelect={handleSelect}
          onDetail={handleAttendeeDetail}
          width={dims.w}
          height={dims.h}
          assignments={assignments}
        />
        </div>
      </div>

      {/* LEGEND — desktop only */}
      {!isMobile && <div style={{ display: "flex", gap: 14, padding: "0 20px 14px", background: "transparent", flexWrap: "wrap" }}>
        {view === "calling" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#38bdf8" strokeWidth="2" strokeDasharray="10,5" /></svg>
            <span>Reporting flow ↑</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,9" strokeLinecap="round" /></svg>
            <span>Stake instruction ↓ (dots)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#34d399" strokeWidth="1.5" strokeDasharray="8,5" /></svg>
            <span>Works with ↔ (ping-pong)</span>
          </div>
        </>}
        {view === "responsibility" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#475569" strokeWidth="2" strokeDasharray="10,5" /></svg>
            <span>Reporting flow ↑</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,9" strokeLinecap="round" /></svg>
            <span>Stake instruction ↓ (dots)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#34d399" strokeWidth="1.5" strokeDasharray="8,5" /></svg>
            <span>Works with ↔ (ping-pong)</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>All lines animated showing info direction</div>
        </>}
        {view === "meeting" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#334155" strokeWidth="1.2" strokeDasharray="4,3" /></svg>Animated lines = info flowing between meetings
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
            Two lines = bidirectional flow
          </div>
        </>}
      </div>}

      {/* DETAIL PANEL */}
      {detailData && (
        <DetailPanel
          data={detailData.data}
          type={detailData.type}
          onClose={() => { setSelected(null); setDetailData(null); }}
          respFilter={view === "responsibility" ? respFilter : null}
          isMobile={dims.w < 600}
          assignments={assignments}
          meetings={meetings}
          selectedUnit={selectedUnit}
          loading={loading}
          onCopyPhones={handleCopyPhones}
        />
      )}

      <div style={{ textAlign: "center", padding: "0 6px 12px", fontSize: 10, color: "#94a3b8" }}>
        Source: General Handbook · Chapters 4, 6–13, 17, 21–25, 29–30
      </div>
    </div>
  );
}
