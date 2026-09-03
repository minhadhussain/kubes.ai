import { StatusBadge } from "@/components/ui/status-badge";
import { WorkspaceModulePage, type WorkspaceModuleConfig } from "@/components/workspace/workspace-module-page";

type TableRow = {
  primary: string;
  status: string;
  owner: string;
  nextAction: string;
  tone: "accent" | "neutral" | "warning" | "danger";
};

type ModuleMap = Record<string, WorkspaceModuleConfig<TableRow>>;

const modules: ModuleMap = {
  crm: {
    label: "CRM",
    title: "Relationship command center",
    description: "Track client activity, follow-ups, and relationship health across every deal and conversation.",
    meta: [
      { label: "Coverage", value: "246 active records" },
      { label: "Health", value: "12 follow-ups due", tone: "warning" }
    ],
    actions: [
      { label: "Add contact", href: "/contacts" },
      { label: "Review leads", href: "/leads", tone: "secondary" }
    ],
    metrics: [
      { label: "Open relationships", value: 246, meta: "Buyers, sellers, and referrals under management", tone: "accent", status: "Live" },
      { label: "Follow-ups due", value: 12, meta: "Calls and check-ins due before close of day", status: "Watch" },
      { label: "Warm prospects", value: 37, meta: "Recently engaged contacts moving toward qualification" },
      { label: "Referral partners", value: 18, meta: "Lenders, attorneys, and vendors in rotation" }
    ],
    activityLabel: "Recent activity",
    activityTitle: "Client momentum",
    activityItems: [
      { time: "09:15", title: "Ananya Shah requested updated shortlists", description: "Buyer profile was refreshed with budget expansion and two new preferred zones.", tone: "accent" },
      { time: "10:05", title: "Referral partner sent three inbound introductions", description: "Each prospect still needs a first call and source attribution before handoff.", tone: "warning" },
      { time: "11:40", title: "Seller nurture sequence paused on one account", description: "Owner asked to resume outreach after this weekend open house.", tone: "neutral" }
    ],
    tableLabel: "Priority contacts",
    tableTitle: "Who needs attention now",
    tableColumns: [
      { key: "primary", header: "Contact", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Rohan Mehta · Buyer", status: "Hot", owner: "Alex", nextAction: "Send financing checklist", tone: "accent" },
      { primary: "Maya Rao · Seller", status: "Needs review", owner: "Priya", nextAction: "Approve listing photos", tone: "warning" },
      { primary: "Blue Oak Lending", status: "Partner", owner: "Alex", nextAction: "Confirm rate sheet for client packet", tone: "neutral" }
    ],
    cardsLabel: "CRM workflows",
    cardsTitle: "Business actions in progress",
    cards: [
      { label: "Retention", title: "Past-client anniversary campaign", description: "Nine homeowners enter the monthly check-in sequence next week with handwritten note reminders.", meta: "Email · Gifts · Referrals" },
      { label: "Assignment", title: "Round-robin lead ownership", description: "New online leads are currently split between Alex and Priya based on source response SLA.", meta: "Inbound · Routing · SLA" },
      { label: "Service", title: "VIP client watchlist", description: "Three high-value clients have active search requests and need twice-daily update cadence.", meta: "High touch · Search · Offer prep" }
    ]
  },
  leads: {
    label: "Leads",
    title: "Lead pipeline",
    description: "Manage new enquiries, qualification status, and the next step required to convert attention into appointments.",
    meta: [
      { label: "Today", value: "14 new leads" },
      { label: "Conversion watch", value: "5 aging leads", tone: "warning" }
    ],
    actions: [
      { label: "Add lead", href: "/leads" },
      { label: "Open CRM", href: "/crm", tone: "secondary" }
    ],
    metrics: [
      { label: "New today", value: 14, meta: "Fresh enquiries from portals, referrals, and direct calls", tone: "accent", status: "Live" },
      { label: "Qualified", value: 28, meta: "Prospects with defined timeline and buying intent" },
      { label: "Showings booked", value: 9, meta: "Leads already converted into field activity" },
      { label: "Stalled", value: 5, meta: "Records with no touch in the last 72 hours", status: "Watch" }
    ],
    activityLabel: "Pipeline movement",
    activityTitle: "Lead flow this morning",
    activityItems: [
      { time: "08:55", title: "Three portal leads imported from paid campaign", description: "Budget range and preferred neighborhoods are already mapped for first response.", tone: "accent" },
      { time: "10:20", title: "Buyer from referral network moved to qualified", description: "Financing is pre-cleared and family wants to tour this weekend.", tone: "accent" },
      { time: "11:10", title: "Two older enquiries are at risk of going cold", description: "No outbound contact has landed since Friday. Response window is slipping.", tone: "warning" }
    ],
    tableLabel: "Lead queue",
    tableTitle: "Priority outreach",
    tableColumns: [
      { key: "primary", header: "Lead", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Stage", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Nikhil Arora · 3BHK buyer", status: "New", owner: "Alex", nextAction: "Call within 10 minutes", tone: "accent" },
      { primary: "Sara Joseph · Seller enquiry", status: "Qualified", owner: "Priya", nextAction: "Book valuation visit", tone: "neutral" },
      { primary: "Imran Khan · Investor", status: "At risk", owner: "Alex", nextAction: "Send shortlist and WhatsApp follow-up", tone: "warning" }
    ],
    cardsLabel: "Pipeline insights",
    cardsTitle: "Conversion levers",
    cards: [
      { label: "Response time", title: "Fastest source this week: referrals", description: "Referral leads are converting to calls 2.3x faster than portal traffic and need priority handling.", meta: "Source mix · Speed to lead" },
      { label: "Qualification", title: "Portal leads need better pre-screening", description: "Most drop-off is happening before budget and financing readiness are confirmed.", meta: "Script · Forms · Intake" },
      { label: "Field conversion", title: "Weekend showings are nearly full", description: "Current pipeline can support two more qualified tours before capacity gets stretched.", meta: "Saturday tours · Capacity" }
    ]
  },
  contacts: {
    label: "Contacts",
    title: "Contact directory",
    description: "Maintain a clean directory of buyers, sellers, vendors, and partners with ownership and relationship context.",
    meta: [
      { label: "Directory", value: "418 contacts" },
      { label: "Duplicates", value: "7 to merge", tone: "warning" }
    ],
    actions: [
      { label: "New contact", href: "/contacts" },
      { label: "Open CRM", href: "/crm", tone: "secondary" }
    ],
    metrics: [
      { label: "Active buyers", value: 124, meta: "Clients currently searching or touring properties", tone: "accent" },
      { label: "Active sellers", value: 56, meta: "Owners in listing prep, market, or negotiation" },
      { label: "Vendors", value: 41, meta: "Mortgage, legal, photography, staging, and inspection partners" },
      { label: "Unassigned", value: 9, meta: "New records waiting for owner allocation", status: "Watch" }
    ],
    activityLabel: "Directory updates",
    activityTitle: "Recent changes",
    activityItems: [
      { time: "09:00", title: "Two duplicate buyer records flagged", description: "Phone and email overlap suggests merge before next outreach run.", tone: "warning" },
      { time: "09:45", title: "Preferred vendor roster refreshed", description: "New photographer and legal contact added for west-side listings.", tone: "accent" },
      { time: "11:30", title: "Past client moved into referral segment", description: "Closed transaction from last quarter has now generated one new inbound lead.", tone: "accent" }
    ],
    tableLabel: "Directory view",
    tableTitle: "Contacts needing review",
    tableColumns: [
      { key: "primary", header: "Contact", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Type", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Aditi Verma", status: "Buyer", owner: "Alex", nextAction: "Update budget after lender call", tone: "accent" },
      { primary: "Metro Home Inspections", status: "Vendor", owner: "Ops", nextAction: "Renew preferred pricing sheet", tone: "neutral" },
      { primary: "Kabir & Neha Sethi", status: "Duplicate", owner: "Priya", nextAction: "Merge records and preserve notes", tone: "warning" }
    ],
    cardsLabel: "Contact operations",
    cardsTitle: "Relationship housekeeping",
    cards: [
      { label: "Segmentation", title: "Buyer search clusters are current", description: "Contact tags are aligned to investment, rental, and primary-home demand buckets.", meta: "Tags · Search profiles" },
      { label: "Ownership", title: "Top producers hold most high-intent sellers", description: "Consider rebalancing a portion of listing-side intake to protect response times.", meta: "Workload · Routing" },
      { label: "Data hygiene", title: "Email completion rate improved", description: "Only 4% of active contacts are still missing a verified email address.", meta: "Quality · Outreach readiness" }
    ]
  },
  properties: {
    label: "Properties",
    title: "Property database",
    description: "View canonical property records with pricing, readiness, and attached client demand before they become active listings.",
    meta: [
      { label: "Inventory", value: "132 properties" },
      { label: "Attention", value: "6 incomplete records", tone: "warning" }
    ],
    actions: [
      { label: "Add property", href: "/properties" },
      { label: "Manage listings", href: "/listings", tone: "secondary" }
    ],
    metrics: [
      { label: "Live records", value: 132, meta: "Residential and investment inventory tracked in workspace", tone: "accent" },
      { label: "Buyer matches", value: 48, meta: "Properties currently attached to active search profiles" },
      { label: "Pre-market", value: 11, meta: "Homes being prepared before listing launch" },
      { label: "Missing media", value: 6, meta: "Records still missing photos or floor plans", status: "Watch" }
    ],
    activityLabel: "Inventory movement",
    activityTitle: "Property operations",
    activityItems: [
      { time: "08:40", title: "New villa record created in Jubilee Hills", description: "Photography and pricing guidance are still pending before launch recommendation.", tone: "accent" },
      { time: "10:15", title: "Two search clients matched to one townhouse", description: "The property now appears in both buyer shortlists for weekend tours.", tone: "accent" },
      { time: "11:50", title: "Inspection notes missing on one resale unit", description: "The record should be updated before any new offer discussions begin.", tone: "warning" }
    ],
    tableLabel: "Property watchlist",
    tableTitle: "Records needing action",
    tableColumns: [
      { key: "primary", header: "Property", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "State", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "12 Palm Residences · 4BR Villa", status: "Pre-market", owner: "Alex", nextAction: "Approve staging proposal", tone: "accent" },
      { primary: "Orchid Heights 802 · Condo", status: "Ready", owner: "Priya", nextAction: "Attach comparative pricing note", tone: "neutral" },
      { primary: "Maple Street 19 · Duplex", status: "Incomplete", owner: "Ops", nextAction: "Upload floor plan and compliance docs", tone: "warning" }
    ],
    cardsLabel: "Inventory insights",
    cardsTitle: "Supply and demand",
    cards: [
      { label: "Demand", title: "Luxury buyer demand remains strongest", description: "High-budget search demand is concentrated in three neighborhoods with limited fresh supply.", meta: "Luxury · Search pressure" },
      { label: "Readiness", title: "Median prep time is improving", description: "Property records are moving from intake to market-ready state faster than last month.", meta: "Prep cycle · Ops" },
      { label: "Coverage", title: "Rental inventory is underrepresented", description: "Current database leans heavily toward sale-side stock compared with inbound tenant demand.", meta: "Rental · Growth opportunity" }
    ]
  },
  listings: {
    label: "Listings",
    title: "Listing management",
    description: "Monitor listing status, seller readiness, campaign momentum, and showing demand from launch through negotiation.",
    meta: [
      { label: "Market", value: "28 active listings" },
      { label: "Urgency", value: "4 price reviews", tone: "warning" }
    ],
    actions: [
      { label: "New listing", href: "/listings" },
      { label: "See properties", href: "/properties", tone: "secondary" }
    ],
    metrics: [
      { label: "Active listings", value: 28, meta: "Inventory currently marketed to buyers", tone: "accent", status: "Live" },
      { label: "Coming soon", value: 7, meta: "Seller-side prep underway before launch" },
      { label: "Under contract", value: 5, meta: "Listings already in negotiation or legal motion" },
      { label: "Needs repricing", value: 4, meta: "Traffic is soft relative to seller expectation", status: "Watch" }
    ],
    activityLabel: "Listing pulse",
    activityTitle: "Market-side updates",
    activityItems: [
      { time: "09:10", title: "Open house campaign approved for Lakeview Tower", description: "Creative assets and broker outreach are now queued for weekend promotion.", tone: "accent" },
      { time: "10:35", title: "Seller requested pricing review on one townhouse", description: "Traffic remains high but serious offers have not landed yet.", tone: "warning" },
      { time: "12:00", title: "One listing moved to under contract", description: "Buyer deposit received and transaction file is ready for activation.", tone: "accent" }
    ],
    tableLabel: "Listing board",
    tableTitle: "Market priorities",
    tableColumns: [
      { key: "primary", header: "Listing", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Agent", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Lakeview Tower 1403", status: "Active", owner: "Alex", nextAction: "Confirm Sunday open house staffing", tone: "accent" },
      { primary: "Rosewood Lane 8", status: "Price review", owner: "Priya", nextAction: "Share market comps with seller", tone: "warning" },
      { primary: "Cedar Park Villa", status: "Under contract", owner: "Alex", nextAction: "Move file to transactions", tone: "neutral" }
    ],
    cardsLabel: "Listing performance",
    cardsTitle: "Seller-side execution",
    cards: [
      { label: "Traffic", title: "Photo quality is lifting enquiry volume", description: "Listings refreshed with new media are drawing stronger click-through and showing requests.", meta: "Media · Demand" },
      { label: "Seller comms", title: "Weekly reporting cadence is on track", description: "Every active seller has a scheduled update before the weekend traffic window.", meta: "Seller updates · Retention" },
      { label: "Negotiation", title: "Three listings are close to offer stage", description: "Buyer feedback is positive and pricing objections are narrowing rather than widening.", meta: "Offers · Negotiation" }
    ]
  },
  calendar: {
    label: "Calendar",
    title: "Calendar and scheduling",
    description: "Coordinate calls, inspections, showings, deadlines, and client meetings from a single schedule view.",
    meta: [
      { label: "Today", value: "17 scheduled events" },
      { label: "Conflicts", value: "2 overlaps", tone: "warning" }
    ],
    actions: [
      { label: "Schedule event", href: "/calendar" },
      { label: "Open showings", href: "/showings", tone: "secondary" }
    ],
    metrics: [
      { label: "Appointments", value: 17, meta: "Calls, meetings, valuations, and inspections set for today", tone: "accent", status: "Live" },
      { label: "Showings", value: 6, meta: "Tours mapped into the day plan" },
      { label: "Deadlines", value: 4, meta: "Offer, document, and compliance checkpoints this week" },
      { label: "Conflicts", value: 2, meta: "Events needing rescheduling or reassignment", status: "Watch" }
    ],
    activityLabel: "Schedule flow",
    activityTitle: "Today in motion",
    activityItems: [
      { time: "09:30", title: "Client call confirmed", description: "Buyer requested revised shortlist before afternoon property tour.", tone: "accent" },
      { time: "11:00", title: "Property showing locked in", description: "Seller approved access instructions and team route is finalized.", tone: "accent" },
      { time: "14:30", title: "Seller meeting overlaps with inspection prep", description: "One event should be reassigned to avoid a tight transition window.", tone: "warning" }
    ],
    tableLabel: "Day planner",
    tableTitle: "Upcoming blocks",
    tableColumns: [
      { key: "primary", header: "Event", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Type", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "11:00 · Palm Residences tour", status: "Showing", owner: "Alex", nextAction: "Send route and gate access", tone: "accent" },
      { primary: "14:30 · Seller pricing meeting", status: "Meeting", owner: "Priya", nextAction: "Attach updated comparative report", tone: "neutral" },
      { primary: "16:00 · Inspection review", status: "Conflict", owner: "Ops", nextAction: "Move to 16:30 or reassign", tone: "warning" }
    ],
    cardsLabel: "Scheduling insights",
    cardsTitle: "Capacity and coordination",
    cards: [
      { label: "Capacity", title: "Saturday is near showing limit", description: "Only a small amount of field capacity remains before rescheduling becomes necessary.", meta: "Weekend load · Tours" },
      { label: "Travel", title: "Route efficiency improved this week", description: "Grouped showings are reducing dead travel time between neighborhoods.", meta: "Routing · Efficiency" },
      { label: "Deadlines", title: "Offer milestones need early-day review", description: "Document and finance deadlines are clustering late in the week.", meta: "Compliance · Timing" }
    ]
  },
  showings: {
    label: "Showings",
    title: "Showing management",
    description: "Track tours, buyer feedback, seller access, and follow-up actions after each field visit.",
    meta: [
      { label: "Today", value: "6 active tours" },
      { label: "Feedback pending", value: "3 tours", tone: "warning" }
    ],
    actions: [
      { label: "Book showing", href: "/showings" },
      { label: "Open calendar", href: "/calendar", tone: "secondary" }
    ],
    metrics: [
      { label: "Scheduled tours", value: 6, meta: "Buyer and seller-side appointments in motion today", tone: "accent", status: "Live" },
      { label: "Completed this week", value: 21, meta: "Showings already converted into feedback or negotiation next steps" },
      { label: "Repeat visits", value: 4, meta: "Properties getting a second look from serious buyers" },
      { label: "Pending notes", value: 3, meta: "Feedback still missing from team or client", status: "Watch" }
    ],
    activityLabel: "Field updates",
    activityTitle: "Showing desk",
    activityItems: [
      { time: "10:00", title: "Buyer requested a second tour at Cedar Park", description: "Kitchen layout feedback was positive and financing confidence is strong.", tone: "accent" },
      { time: "11:25", title: "Access note changed for one condo showing", description: "Building entry now requires broker desk confirmation before arrival.", tone: "warning" },
      { time: "12:10", title: "Seller asked for immediate feedback summary", description: "The tour is complete but client comments are not logged yet.", tone: "warning" }
    ],
    tableLabel: "Showing board",
    tableTitle: "Tours needing follow-through",
    tableColumns: [
      { key: "primary", header: "Showing", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Palm Residences · Rohan Mehta", status: "Scheduled", owner: "Alex", nextAction: "Send reminder 30 mins before arrival", tone: "accent" },
      { primary: "Cedar Park Villa · Maya Rao", status: "Repeat visit", owner: "Priya", nextAction: "Prepare comparison sheet", tone: "neutral" },
      { primary: "Lakeview Tower · Aditi Verma", status: "Feedback pending", owner: "Alex", nextAction: "Log objections before seller update", tone: "warning" }
    ],
    cardsLabel: "Field intelligence",
    cardsTitle: "Showing performance",
    cards: [
      { label: "Buyer intent", title: "Second visits are trending upward", description: "Repeat showings suggest shortlist quality is improving for motivated buyers.", meta: "Intent · Match quality" },
      { label: "Seller service", title: "Response cadence needs tightening", description: "Feedback should reach sellers the same day to sustain trust and momentum.", meta: "Seller updates · SLA" },
      { label: "Access", title: "Luxury inventory requires tighter coordination", description: "Concierge and gated access instructions are adding friction to field scheduling.", meta: "Access control · Operations" }
    ]
  },
  tasks: {
    label: "Tasks",
    title: "Task manager",
    description: "Run daily operations from a prioritized task queue across clients, listings, and live deals.",
    meta: [
      { label: "Open", value: "38 tasks" },
      { label: "Overdue", value: "6 items", tone: "danger" }
    ],
    actions: [
      { label: "Create task", href: "/tasks" },
      { label: "View transactions", href: "/transactions", tone: "secondary" }
    ],
    metrics: [
      { label: "Open tasks", value: 38, meta: "Current workload across pipeline and execution", tone: "accent", status: "Live" },
      { label: "Due today", value: 14, meta: "Items that need completion before close of business" },
      { label: "Delegated", value: 11, meta: "Assigned to coordinators or support roles" },
      { label: "Overdue", value: 6, meta: "Items that are already slipping against service standards", status: "Risk" }
    ],
    activityLabel: "Task cadence",
    activityTitle: "Execution load",
    activityItems: [
      { time: "08:50", title: "Three follow-up tasks closed before first meeting", description: "Morning response window is back under target for hot buyer enquiries.", tone: "accent" },
      { time: "10:40", title: "Document request still unassigned", description: "A missing owner is slowing one transaction handoff to finance.", tone: "warning" },
      { time: "11:55", title: "Inspection checklist is now overdue", description: "Closing file cannot progress until the missing signature is collected.", tone: "danger" }
    ],
    tableLabel: "Task queue",
    tableTitle: "Priority work",
    tableColumns: [
      { key: "primary", header: "Task", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Send offer summary to seller", status: "Due today", owner: "Alex", nextAction: "Complete before 15:00", tone: "accent" },
      { primary: "Upload compliance packet", status: "Blocked", owner: "Ops", nextAction: "Collect missing ID proof", tone: "warning" },
      { primary: "Inspection signature follow-up", status: "Overdue", owner: "Priya", nextAction: "Call buyer and escrow now", tone: "danger" }
    ],
    cardsLabel: "Task insights",
    cardsTitle: "Operational pressure points",
    cards: [
      { label: "Focus", title: "Most overdue work sits in transaction support", description: "Execution debt is building later in the funnel more than in top-of-funnel sales work.", meta: "Closings · Compliance" },
      { label: "Automation", title: "Recurring admin work is still manual", description: "Inspection reminders and seller weekly reports are good candidates for templates.", meta: "Templates · Efficiency" },
      { label: "Capacity", title: "Team coverage is adequate through midday", description: "Afternoon handoffs will need tighter ownership to avoid more spillover into tomorrow.", meta: "Workload · Staffing" }
    ]
  },
  transactions: {
    label: "Transactions",
    title: "Deal management",
    description: "Run accepted offers through compliance, financing, inspections, and closing with visibility on every risk.",
    meta: [
      { label: "Live deals", value: "8 transactions" },
      { label: "Risk", value: "2 delayed files", tone: "warning" }
    ],
    actions: [
      { label: "Open new deal", href: "/transactions" },
      { label: "Review documents", href: "/documents", tone: "secondary" }
    ],
    metrics: [
      { label: "Active transactions", value: 8, meta: "Deals currently moving toward close", tone: "accent", status: "Live" },
      { label: "Closing this month", value: 5, meta: "Files expected to complete within the current cycle" },
      { label: "Inspection stage", value: 2, meta: "Transactions currently waiting on reports or negotiations" },
      { label: "At risk", value: 2, meta: "Deadlines or documents are slipping against plan", status: "Watch" }
    ],
    activityLabel: "Deal flow",
    activityTitle: "Transaction command",
    activityItems: [
      { time: "09:20", title: "Escrow confirmed on Palm Residences deal", description: "File is clear to move into appraisal and finance tracking.", tone: "accent" },
      { time: "10:50", title: "Inspection objection received on Cedar Park", description: "Seller response should land before tomorrow morning to preserve momentum.", tone: "warning" },
      { time: "12:05", title: "Closing packet missing one signed disclosure", description: "The file is nearing deadline and needs immediate recovery.", tone: "danger" }
    ],
    tableLabel: "Deal board",
    tableTitle: "Transactions needing action",
    tableColumns: [
      { key: "primary", header: "Transaction", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Stage", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Lead", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Palm Residences · Mehta family", status: "Financing", owner: "Alex", nextAction: "Confirm lender appraisal date", tone: "accent" },
      { primary: "Cedar Park Villa · Maya Rao", status: "Inspection", owner: "Priya", nextAction: "Negotiate repair credit", tone: "warning" },
      { primary: "Lakeview Tower 1403", status: "Closing risk", owner: "Ops", nextAction: "Secure final disclosure signature", tone: "danger" }
    ],
    cardsLabel: "Deal insights",
    cardsTitle: "Closing performance",
    cards: [
      { label: "Velocity", title: "Average deal cycle is tightening", description: "Finance and document preparation are moving faster on newly accepted files.", meta: "Cycle time · Efficiency" },
      { label: "Risk", title: "Inspection remains the highest friction stage", description: "Most delays are appearing between report delivery and negotiated resolution.", meta: "Inspection · Repairs" },
      { label: "Revenue", title: "Most expected income sits in four deals", description: "A small set of active files now drives the majority of near-term commission outlook.", meta: "Revenue concentration" }
    ]
  },
  documents: {
    label: "Documents",
    title: "Document management",
    description: "Keep contracts, disclosures, marketing assets, and financial files organized against the records that depend on them.",
    meta: [
      { label: "Stored", value: "312 files" },
      { label: "Missing", value: "9 required docs", tone: "warning" }
    ],
    actions: [
      { label: "Upload file", href: "/documents" },
      { label: "Open transactions", href: "/transactions", tone: "secondary" }
    ],
    metrics: [
      { label: "Active files", value: 312, meta: "Documents tied to listings, offers, and deals", tone: "accent", status: "Live" },
      { label: "Pending signatures", value: 9, meta: "Files waiting on buyer, seller, or broker execution" },
      { label: "Marketing assets", value: 64, meta: "Photos, brochures, and digital listing packs in rotation" },
      { label: "Archive ready", value: 21, meta: "Files eligible for close-out and archival", status: "Watch" }
    ],
    activityLabel: "File activity",
    activityTitle: "Document desk",
    activityItems: [
      { time: "08:35", title: "Listing brochure uploaded for Rosewood Lane", description: "Marketing package is now complete for seller approval and launch.", tone: "accent" },
      { time: "10:30", title: "Buyer signature still missing on one amendment", description: "The transaction file cannot move forward until execution is complete.", tone: "warning" },
      { time: "11:45", title: "Closed file is ready for archive", description: "Retention labels and expense receipts are complete on the deal packet.", tone: "neutral" }
    ],
    tableLabel: "Document queue",
    tableTitle: "Files needing action",
    tableColumns: [
      { key: "primary", header: "Document", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Palm Residences purchase agreement", status: "Pending signature", owner: "Alex", nextAction: "Chase buyer execution today", tone: "warning" },
      { primary: "Rosewood Lane brochure pack", status: "Ready", owner: "Marketing", nextAction: "Publish to seller folder", tone: "accent" },
      { primary: "Lakeview Tower closing packet", status: "Archive", owner: "Ops", nextAction: "Move to closed-deal storage", tone: "neutral" }
    ],
    cardsLabel: "Document insights",
    cardsTitle: "Compliance and access",
    cards: [
      { label: "Compliance", title: "Signature lag is the biggest blocker", description: "Most missing file issues are not uploads, but unfinished execution workflows.", meta: "E-sign · Turnaround" },
      { label: "Marketing", title: "Seller assets are more organized than last cycle", description: "Listing media and brochures are now bundled earlier in the launch process.", meta: "Launch prep · Media" },
      { label: "Retention", title: "Archival hygiene is improving", description: "Closed transaction files are being cleaned up with fewer missing receipts and approvals.", meta: "Archive · Audit readiness" }
    ]
  },
  finance: {
    label: "Finance",
    title: "Commission and expenses",
    description: "Track expected income, paid commissions, and operating expenses across active and closed transactions.",
    meta: [
      { label: "Expected", value: "$124K pipeline" },
      { label: "Watch", value: "$8K pending docs", tone: "warning" }
    ],
    actions: [
      { label: "Add expense", href: "/finance" },
      { label: "Open transactions", href: "/transactions", tone: "secondary" }
    ],
    metrics: [
      { label: "Expected income", value: "$124K", meta: "Projected revenue from active deal pipeline", tone: "accent", status: "Live" },
      { label: "Approved commissions", value: "$61K", meta: "Revenue already cleared for payment stage" },
      { label: "Monthly expenses", value: "$11.8K", meta: "Marketing, travel, staging, and support spend" },
      { label: "Pending backup", value: "$8K", meta: "Commission items still waiting on complete documentation", status: "Watch" }
    ],
    activityLabel: "Finance activity",
    activityTitle: "Revenue operations",
    activityItems: [
      { time: "09:05", title: "One commission moved to approved", description: "Closing disclosures were received and payout review can proceed.", tone: "accent" },
      { time: "10:15", title: "Marketing spend crossed this week’s target", description: "Open house and portal spend should be reviewed against source performance.", tone: "warning" },
      { time: "11:35", title: "Expense receipt uploaded for staging invoice", description: "The amount is now tied to the transaction ledger for net-income tracking.", tone: "neutral" }
    ],
    tableLabel: "Finance queue",
    tableTitle: "Revenue and spend watchlist",
    tableColumns: [
      { key: "primary", header: "Item", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Palm Residences commission", status: "Approved", owner: "Finance", nextAction: "Schedule payout", tone: "accent" },
      { primary: "Rosewood staging invoice", status: "Receipt pending", owner: "Ops", nextAction: "Upload vendor invoice", tone: "warning" },
      { primary: "Portal campaign spend", status: "Review", owner: "Alex", nextAction: "Compare CPL against referrals", tone: "neutral" }
    ],
    cardsLabel: "Finance insights",
    cardsTitle: "Profitability signals",
    cards: [
      { label: "Revenue", title: "Closing pipeline remains healthy", description: "Expected income is concentrated in near-term files rather than distant prospects.", meta: "Pipeline quality · Revenue" },
      { label: "Spend", title: "Advertising costs need tighter scrutiny", description: "Portal spend is rising faster than direct and referral lead generation.", meta: "CAC · Marketing" },
      { label: "Net margin", title: "High-value listings still carry best spread", description: "Premium inventory continues to outperform on commission after marketing and support costs.", meta: "Margin · Listing mix" }
    ]
  },
  analytics: {
    label: "Analytics",
    title: "Business analytics",
    description: "Measure conversion, inventory performance, team activity, and revenue trends across the operating system.",
    meta: [
      { label: "Period", value: "Last 30 days" },
      { label: "Momentum", value: "+12% conversion", tone: "accent" }
    ],
    actions: [
      { label: "Export report", href: "/analytics" },
      { label: "Open finance", href: "/finance", tone: "secondary" }
    ],
    metrics: [
      { label: "Lead-to-client", value: "31%", meta: "Qualified conversion from inbound to active client", tone: "accent", status: "Live" },
      { label: "Avg days to offer", value: 18, meta: "Median time from first showing to submitted offer" },
      { label: "Listing engagement", value: "4.7x", meta: "Average listing enquiry multiplier versus baseline" },
      { label: "Revenue outlook", value: "$124K", meta: "Expected income inside current pipeline" }
    ],
    activityLabel: "Performance shifts",
    activityTitle: "Operational trends",
    activityItems: [
      { time: "This week", title: "Referral conversion outperformed paid channels", description: "Warm introductions continue to close faster and with less follow-up effort.", tone: "accent" },
      { time: "This month", title: "Luxury listings drove most seller-side engagement", description: "Photo-rich campaigns and private-tour workflows are pulling stronger response.", tone: "accent" },
      { time: "Watch", title: "Task backlog is starting to pressure closing operations", description: "Execution debt is rising in transactions more than in top-of-funnel work.", tone: "warning" }
    ],
    tableLabel: "KPI board",
    tableTitle: "Metrics requiring attention",
    tableColumns: [
      { key: "primary", header: "Metric", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Trend", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Area", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Lead response time", status: "Improving", owner: "Leads", nextAction: "Maintain first-call SLA", tone: "accent" },
      { primary: "Paid channel ROI", status: "Under review", owner: "Marketing", nextAction: "Rebalance spend toward referrals", tone: "warning" },
      { primary: "Closing cycle time", status: "Stable", owner: "Transactions", nextAction: "Monitor inspection stage delays", tone: "neutral" }
    ],
    cardsLabel: "Analyst notes",
    cardsTitle: "What the numbers suggest",
    cards: [
      { label: "Growth", title: "Conversion efficiency is improving", description: "The team is turning fewer raw leads into more qualified client conversations.", meta: "Efficiency · Funnel quality" },
      { label: "Operations", title: "Execution risk is shifting deeper into the funnel", description: "Top-of-funnel response looks healthy, but transaction follow-through needs attention.", meta: "Tasks · Closings" },
      { label: "Revenue", title: "Near-term income remains solid", description: "Deal concentration is manageable, but seller-side performance still drives the strongest upside.", meta: "Forecast · Mix" }
    ]
  },
  "client-portal": {
    label: "Client Portal",
    title: "Client-facing experience",
    description: "Prepare shared updates, active property selections, and next-step visibility for buyers and sellers outside the internal workspace.",
    meta: [
      { label: "Live portals", value: "12 shared spaces" },
      { label: "Unread", value: "4 client updates", tone: "warning" }
    ],
    actions: [
      { label: "Create portal", href: "/client-portal" },
      { label: "Open contacts", href: "/contacts", tone: "secondary" }
    ],
    metrics: [
      { label: "Active portals", value: 12, meta: "Buyers and sellers with shared workspace access", tone: "accent", status: "Live" },
      { label: "Shared shortlists", value: 19, meta: "Properties curated for active client review" },
      { label: "Pending approvals", value: 5, meta: "Client confirmations needed on viewings, offers, or docs" },
      { label: "Unread messages", value: 4, meta: "Client questions still waiting on response", status: "Watch" }
    ],
    activityLabel: "Portal activity",
    activityTitle: "Client-facing updates",
    activityItems: [
      { time: "09:05", title: "Buyer shortlist updated with two new matches", description: "The client portal now includes fresh inventory and revised notes from the latest call.", tone: "accent" },
      { time: "10:25", title: "Seller requested viewing summary inside portal", description: "Feedback needs to be published before the evening check-in call.", tone: "warning" },
      { time: "11:15", title: "Offer packet shared for client review", description: "Documents and approval timeline are now visible in one client-facing view.", tone: "accent" }
    ],
    tableLabel: "Client access",
    tableTitle: "Portals needing action",
    tableColumns: [
      { key: "primary", header: "Portal", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "Status", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Mehta Family Buyer Portal", status: "Active", owner: "Alex", nextAction: "Publish tour notes after showing", tone: "accent" },
      { primary: "Rao Seller Portal", status: "Needs update", owner: "Priya", nextAction: "Upload weekly traffic report", tone: "warning" },
      { primary: "Lakeview Closing Room", status: "Approval pending", owner: "Ops", nextAction: "Collect final acknowledgement", tone: "neutral" }
    ],
    cardsLabel: "Portal workflows",
    cardsTitle: "Client experience signals",
    cards: [
      { label: "Transparency", title: "Clients want status without chasing the team", description: "The strongest portal usage appears where updates are proactive and tied to milestones.", meta: "Trust · Visibility" },
      { label: "Search", title: "Shortlist curation drives repeat visits", description: "Buyer portals with agent notes and property rankings are getting the most engagement.", meta: "Buyer UX · Selection" },
      { label: "Closing", title: "Document visibility reduces back-and-forth", description: "Shared closing rooms are helping clients understand what is still pending.", meta: "Docs · Milestones" }
    ]
  },
  settings: {
    label: "Settings",
    title: "Workspace settings",
    description: "Manage organization identity, team access, notification preferences, and operating defaults that shape the workspace.",
    meta: [
      { label: "Workspace", value: "Agent OS" },
      { label: "Security", value: "2 pending invites", tone: "warning" }
    ],
    actions: [
      { label: "Invite member", href: "/settings" },
      { label: "Open CRM", href: "/crm", tone: "secondary" }
    ],
    metrics: [
      { label: "Team members", value: 8, meta: "Active users with access to the workspace", tone: "accent", status: "Live" },
      { label: "Pending invites", value: 2, meta: "Invitations awaiting acceptance" },
      { label: "Alert rules", value: 14, meta: "Notification and reminder configurations in place" },
      { label: "Storage usage", value: "68%", meta: "Current document and media capacity used", status: "Watch" }
    ],
    activityLabel: "Admin changes",
    activityTitle: "Workspace controls",
    activityItems: [
      { time: "09:00", title: "New coordinator invite sent", description: "Operations support access is pending acceptance and role assignment confirmation.", tone: "accent" },
      { time: "10:10", title: "Reminder rule updated for overdue tasks", description: "Team notifications now escalate after one missed due date instead of two.", tone: "neutral" },
      { time: "11:45", title: "Storage usage is nearing next threshold", description: "Marketing media uploads are the biggest contributor this month.", tone: "warning" }
    ],
    tableLabel: "Admin queue",
    tableTitle: "Settings needing review",
    tableColumns: [
      { key: "primary", header: "Setting", render: (row) => <strong>{row.primary}</strong> },
      { key: "status", header: "State", render: (row) => <StatusBadge label={row.status} tone={row.tone} /> },
      { key: "owner", header: "Owner", render: (row) => <span className="table-meta">{row.owner}</span> },
      { key: "nextAction", header: "Next action", render: (row) => <span>{row.nextAction}</span> }
    ],
    tableRows: [
      { primary: "Coordinator access invitation", status: "Pending", owner: "Admin", nextAction: "Follow up if not accepted today", tone: "warning" },
      { primary: "Task escalation rules", status: "Updated", owner: "Ops", nextAction: "Monitor alert volume this week", tone: "neutral" },
      { primary: "Media storage capacity", status: "Watch", owner: "Admin", nextAction: "Archive older campaign assets", tone: "warning" }
    ],
    cardsLabel: "Workspace administration",
    cardsTitle: "Control center notes",
    cards: [
      { label: "Access", title: "Role assignment should stay lean", description: "Most users only need the modules tied to their daily execution and reporting duties.", meta: "Roles · Permissions" },
      { label: "Notifications", title: "Alert fatigue should be monitored", description: "Escalations help with deadlines, but too many duplicates will weaken team response.", meta: "Alerts · Response" },
      { label: "Capacity", title: "Storage needs will keep rising", description: "Listing photos, brochures, and closing packets are now driving most workspace growth.", meta: "Storage · Planning" }
    ]
  }
};

export function WorkspaceModuleDataPage({ moduleKey }: { moduleKey: keyof typeof modules }) {
  return <WorkspaceModulePage {...modules[moduleKey]} />;
}
