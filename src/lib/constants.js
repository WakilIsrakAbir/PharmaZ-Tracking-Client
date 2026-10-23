// Names shared with the API (server/src/utils.js and the models), plus how they look here.

export const TIME_ZONE = "Asia/Dhaka";

// Where this browser remembers whether the large-screen sidebar is folded ("collapsed" or "open").
export const SIDEBAR_STORAGE_KEY = "pz-sidebar";

export const ROLES = {
  admin: { label: "Admin", description: "Manages the team and sees everything" },
  marketing: { label: "Marketing", description: "Fills in forms and updates their status" },
};

// The onboarding steps, in order. The classes use the status colors in globals.css.
export const STATUSES = {
  ongoing: {
    label: "Ongoing",
    hint: "Talks have started",
    dot: "bg-status-ongoing",
    badge: "bg-status-ongoing-soft text-status-ongoing-ink",
    chip: "bg-status-ongoing-soft text-status-ongoing-ink border-status-ongoing",
  },
  setup: {
    label: "Setup",
    hint: "Profile and slots being set up",
    dot: "bg-status-setup",
    badge: "bg-status-setup-soft text-status-setup-ink",
    chip: "bg-status-setup-soft text-status-setup-ink border-status-setup",
  },
  implementation: {
    label: "Implementation",
    hint: "Going live in PharmaZ247",
    dot: "bg-status-implementation",
    badge: "bg-status-implementation-soft text-status-implementation-ink",
    chip: "bg-status-implementation-soft text-status-implementation-ink border-status-implementation",
  },
  support: {
    label: "Support",
    hint: "Live, now supporting them",
    dot: "bg-status-support",
    badge: "bg-status-support-soft text-status-support-ink",
    chip: "bg-status-support-soft text-status-support-ink border-status-support",
  },
};

export const TYPES = {
  doctor: { label: "Doctor", plural: "Doctors", path: "/doctors", formTitle: "Doctor Onboarding Form" },
  pharmacy: { label: "Pharmacy", plural: "Pharmacies", path: "/pharmacies", formTitle: "Pharmacy Onboarding Form" },
};

// The week starts on Saturday in Bangladesh.
export const DAYS = [
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
];

export const CONSULTATION_TYPES = [
  { value: "in_person", label: "In-Person" },
  { value: "teleconsultation", label: "Teleconsultation" },
];

export const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
];

// Field numbers and labels exactly as on the paper forms, used by the forms and the details view.
export const FIELDS = {
  doctor: {
    name: [1, "Full Name"],
    photo: [2, "Doctor Picture"],
    bmdcRegNo: [3, "BMDC Reg. No."],
    phone: [4, "Phone No"],
    email: [5, "Email"],
    chamberName: [6, "Chamber Name"],
    address: [7, "Chamber Address"],
    consultationTypes: [8, "Consultation Type"],
    chamberNo: [9, "Chamber No."],
    slotDuration: [10, "Slot Duration"],
    available: [11, "Available Days & Time"],
    firstVisit: [12, "First Visit"],
    reportView: [13, "Report View"],
    secondVisit: [14, "2nd Visit (within 1 mo.)"],
    afterOneMonth: [15, "After 1 mo."],
  },
  pharmacy: {
    name: [1, "Pharmacy Name"],
    photo: [2, "Shop Photo"],
    ownerName: [3, "Owner Name"],
    phone: [4, "Phone No"],
    email: [5, "Email"],
    drugLicenseNo: [6, "Drug License No."],
    tradeLicenseNo: [7, "Trade License No."],
    address: [8, "Address"],
    area: [9, "Area / Thana"],
    district: [10, "District"],
    available: [11, "Opening Days & Time"],
    homeDelivery: [12, "Home Delivery"],
    paymentMethods: [13, "Payment Methods"],
  },
};
