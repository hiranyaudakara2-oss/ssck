import type {
  Achievement,
  Announcement,
  CampusEvent,
  CommunityDirectoryMember,
  DownloadResource,
  ExecutivePosition,
  GalleryItem,
  HistoryMilestone,
  SiteSettings,
  Student,
  StudentProject,
  Subject,
  Teacher,
} from '../types';

export const HERO_CAMPUS_IMAGE = '/assets/images/hero_tech_campus_1794797924159.jpg';
export const SCIENCE_BIO_IMAGE = '/assets/images/subject_science_bio_1794797924343.jpg';
export const ENGINEERING_LAB_IMAGE = '/assets/images/subject_engineering_lab_1794797925806.jpg';
export const ICT_STUDIO_IMAGE = '/assets/images/subject_ict_studio_1794797925814.jpg';
export const AGRI_GEO_IMAGE = '/assets/images/subject_agri_geo_1794797926606.jpg';

export const HISTORY_PRINTING_PRESS_IMAGE = '/assets/images/history_printing_press_1794800137386.jpg';
export const HISTORY_TELEPHONE_IMAGE = '/assets/images/history_early_telephone_1794800137732.jpg';
export const HISTORY_FIRST_COMPUTER_IMAGE = '/assets/images/history_first_computer_1794800138677.jpg';
export const HISTORY_INTERNET_MOBILE_IMAGE = '/assets/images/history_internet_mobile_1794800139026.jpg';
export const HISTORY_AI_ROBOTICS_IMAGE = '/assets/images/history_ai_robotics_1794800139907.jpg';

export const DEFAULT_WEB_LOGO =
  '/assets/aistudio/20250218_125255_0000__2_-removebg-preview_f1038a4a.png';

export const DEFAULT_SITE_SETTINGS: Omit<SiteSettings, 'updatedAt' | 'updatedBy'> = {
  siteTitle: 'SSCK TECH',
  tagline: 'SSCK TECH · School Technology Section · Applied Science, Engineering & Computing',
  heroTitle: 'Engineering Tomorrow Through Applied Science & Precision Technology',
  heroSubtitle:
    'SSCK TECH is a vibrant technology community that inspires young minds through science, engineering, and innovation. We promote creativity, teamwork, and practical learning while developing skills to explore new ideas and build a smarter, sustainable future.',
  heroBannerUrl: HERO_CAMPUS_IMAGE,
  logoUrl: DEFAULT_WEB_LOGO,
  aboutMission:
    'To cultivate technically fluent problem-solvers who bridge theoretical science with real-world engineering, sustainable bio-systems, and ethical computing through hands-on laboratory mastery.',
  aboutVision:
    'To stand as a benchmark secondary-level Technology Section recognized nationally and internationally for student research, robotics innovation, and university-ready technical excellence.',
  footerAddress: 'Technology Innovation Wing, SSCK Central Academic Campus',
  footerEmail: 'sscktechsociety@gmail.com',
  footerPhone: '+94 11 269 4820',
  footerCopyright: 'SSCK TECH — School Technology Section. All rights reserved.',
  statsStudents: 640,
  statsProjects: 128,
  statsAwards: 42,
  statsPassRate: 98.4,
  statsVisitors: 18420,
  maintenanceMode: false,
  maintenanceAnnouncement: 'We are currently upgrading our laboratory management servers and core academic systems to deliver an even more powerful platform.',
  maintenanceExpectedTime: 'Expected completion: Today at 4:00 PM UTC',
  socialLinks: {},
};

export const DEFAULT_SUBJECTS: Omit<Subject, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'sft',
    code: 'SFT',
    name: 'Science for Technology',
    shortDescription:
      'Foundational physics, applied chemistry, and quantitative mathematics engineered specifically for technological problem-solving.',
    fullDescription:
      'Science for Technology (SFT) equips students in both Engineering Technology and Bio Systems Technology streams with the essential scientific principles governing mechanics, thermodynamics, electrochemistry, polymer science, and statistical modeling. Laboratory practicals emphasize real instrumentation, error analysis, and industrial calibration.',
    imageUrl: SCIENCE_BIO_IMAGE,
    headTeacherName: 'Dr. Kavinda Wijesekera',
    headTeacherTitle: 'Senior Lecturer in Applied Physics & SFT',
    labFacilities:
      'Analytical Spectrophotometry Bench, Fluid Mechanics Flume, Digital Oscilloscope & Metrology Suite',
    curriculumHighlights: [
      'Applied Mechanics, Kinematics & Structural Statics',
      'Electrochemistry, Corrosion Control & Energy Storage',
      'Polymer Materials & Semiconductor Fundamentals',
      'Biostatistics, Measurement Uncertainty & Calibration',
    ],
    order: 1,
  },
  {
    id: 'et',
    code: 'ET',
    name: 'Engineering Technology',
    shortDescription:
      'Hands-on civil, mechanical, electrical, and mechatronic design from CAD drafting to CNC fabrication and robotics.',
    fullDescription:
      'Engineering Technology (ET) immerses students in mechanical drafting, structural engineering, AC/DC power systems, automotive electronics, and programmable logic controllers. Learners design assemblies in parametric CAD, machine prototypes on 3-axis CNC mills, and validate circuits using precision test instruments.',
    imageUrl: ENGINEERING_LAB_IMAGE,
    headTeacherName: 'Eng. Nalin Rathnayake',
    headTeacherTitle: 'Head of Engineering & Robotics Workshop',
    labFacilities:
      '3-Axis CNC Milling Center, Mechatronics & PLC Bay, Structural Materials Testing Rig, High-Voltage Power Bench',
    curriculumHighlights: [
      'Technical Drawing, Orthographic Projection & 3D CAD',
      'Thermodynamics, Fluid Power & Internal Combustion',
      'Single/Three-Phase Electrical Installations & Motor Control',
      'Embedded Microcontrollers, Robotics & Automated Fabrication',
    ],
    order: 2,
  },
  {
    id: 'ict',
    code: 'ICT',
    name: 'Information & Communication Technology',
    shortDescription:
      'Software engineering, database architecture, computer networks, cybersecurity, and applied web systems.',
    fullDescription:
      'Information and Communication Technology (ICT) develops full-stack computational thinking, relational database design, TCP/IP network administration, Python & web engineering, and IoT cloud integration. Students architect real-world software platforms and maintain campus network infrastructure.',
    imageUrl: ICT_STUDIO_IMAGE,
    headTeacherName: 'Ms. Dilani Perera',
    headTeacherTitle: 'Lead Computing & Network Systems Educator',
    labFacilities:
      '40-Seat Dual-Display Coding Studio, Managed Fiber Server Rack, Embedded IoT & Edge Computing Sandbox',
    curriculumHighlights: [
      'Computer Architecture, Logic Gates & Operating Systems',
      'Relational Databases, SQL Modeling & Data Integrity',
      'Python Programming, Algorithms & Full-Stack Web Apps',
      'TCP/IP Subnetting, Routing & Network Security Essentials',
    ],
    order: 3,
  },
  {
    id: 'bst',
    code: 'BST',
    name: 'Bio Systems Technology',
    shortDescription:
      'Bioprocess engineering, food science, environmental biotechnology, and controlled biological production systems.',
    fullDescription:
      'Bio Systems Technology (BST) bridges biology and engineering to optimize food processing, post-harvest preservation, water quality engineering, tissue culture, and renewable bio-energy systems. Students run sterile microbiology assays and automated environmental control chambers.',
    imageUrl: SCIENCE_BIO_IMAGE,
    headTeacherName: 'Mrs. Tharushi Fernando',
    headTeacherTitle: 'Coordinator of Bio Systems & Biotech Lab',
    labFacilities:
      'Laminar Flow Tissue Culture Hood, Automated Hydroponic & Bioreactor Rack, Water & Food Quality Lab',
    curriculumHighlights: [
      'Microbiology, Fermentation & Bioprocess Control',
      'Food Preservation, Cold-Chain & Quality Assurance',
      'Environmental Engineering & Wastewater Treatment',
      'Renewable Bio-Energy, Biogas & Tissue Culture Systems',
    ],
    order: 4,
  },
  {
    id: 'agriculture',
    code: 'AGRI',
    name: 'Agriculture',
    shortDescription:
      'Precision agronomy, smart greenhouse automation, soil science, and sustainable crop & livestock management.',
    fullDescription:
      'The Agriculture program blends classical agronomy with modern precision farming. Students monitor soil moisture, EC/pH telemetry, drip fertigation schedules, and protected greenhouse cultivation while evaluating sustainable yield optimization and agro-ecological resilience.',
    imageUrl: AGRI_GEO_IMAGE,
    headTeacherName: 'Mr. Samantha Jayawardena',
    headTeacherTitle: 'Senior Agronomy & Smart Farming Instructor',
    labFacilities:
      'Automated Climate-Controlled Greenhouse, Soil Chemistry Testing Unit, Vertical Hydroponic Sensor Array',
    curriculumHighlights: [
      'Soil Physics, Nutrient Cycling & Precision Fertilization',
      'Protected Agriculture & Automated Drip Irrigation',
      'Integrated Pest Management & Crop Genetics',
      'Agri-Business Value Chains & Post-Harvest Engineering',
    ],
    order: 5,
  },
  {
    id: 'geography',
    code: 'GEO',
    name: 'Geography',
    shortDescription:
      'Geospatial Information Systems (GIS), remote sensing, cartography, climate dynamics, and urban spatial planning.',
    fullDescription:
      'Geography in the Technology Section focuses on quantitative spatial science: GIS layer modeling, drone photogrammetry, watershed hydrology, climate telemetry, and sustainable regional planning. Students build digital elevation maps and analyze real satellite imagery.',
    imageUrl: AGRI_GEO_IMAGE,
    headTeacherName: 'Mrs. Anushka Gunasekara',
    headTeacherTitle: 'GIS & Environmental Spatial Science Lead',
    labFacilities:
      'QGIS & Remote Sensing Workstation Lab, Autonomous Mapping Drone Fleet, Campus Automatic Weather Station',
    curriculumHighlights: [
      'Geographic Information Systems (GIS) & Spatial Analysis',
      'Drone Photogrammetry & Satellite Remote Sensing',
      'Climatology, Monsoon Dynamics & Disaster Risk Mapping',
      'Sustainable Urban Infrastructure & Watershed Planning',
    ],
    order: 6,
  },
];

export const DEFAULT_TEACHERS: Omit<Teacher, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'teacher-kavinda',
    name: 'Dr. Kavinda Wijesekera',
    role: 'Section Head & Senior SFT Lecturer',
    department: 'SFT',
    qualifications: 'Ph.D. in Applied Physics, B.Sc. (Hons) Engineering Physics',
    bio: 'Leads curriculum design across Science for Technology and coordinates national Olympiad instrumentation training.',
    photoUrl: SCIENCE_BIO_IMAGE,
    officeRoom: 'Tech Block A · Room 102',
  },
  {
    id: 'teacher-nalin',
    name: 'Eng. Nalin Rathnayake',
    role: 'Head of Engineering Technology',
    department: 'ET',
    qualifications: 'B.Sc. Eng. (Mechanical), AMIESL Chartered Track',
    bio: 'Former industrial automation engineer mentoring student robotics teams, CAD fabrication, and national mechatronics challenges.',
    photoUrl: ENGINEERING_LAB_IMAGE,
    officeRoom: 'Workshop Bay 1 · Room 108',
  },
  {
    id: 'teacher-dilani',
    name: 'Ms. Dilani Perera',
    role: 'Senior ICT & Computing Educator',
    department: 'ICT',
    qualifications: 'M.Sc. in Computer Science, Cisco CCNP Instructor',
    bio: 'Directs the ICT Innovation Studio, supervising full-stack student software platforms, database labs, and cybersecurity competitions.',
    photoUrl: ICT_STUDIO_IMAGE,
    officeRoom: 'Computing Wing · Studio 204',
  },
  {
    id: 'teacher-tharushi',
    name: 'Mrs. Tharushi Fernando',
    role: 'Lead Bio Systems Educator',
    department: 'BST',
    qualifications: 'M.Phil. in Biotechnology, B.Sc. Food Science & Technology',
    bio: 'Specializes in bioprocess engineering, aseptic tissue culture, and environmental water quality monitoring.',
    photoUrl: SCIENCE_BIO_IMAGE,
    officeRoom: 'Bio Lab Wing · Room 210',
  },
  {
    id: 'teacher-samantha',
    name: 'Mr. Samantha Jayawardena',
    role: 'Precision Agriculture Instructor',
    department: 'Agriculture',
    qualifications: 'M.Sc. in Agricultural Engineering, B.Sc. Agriculture',
    bio: 'Manages the vertical hydroponic array and IoT greenhouse fertigation experiments for senior technology cohorts.',
    photoUrl: AGRI_GEO_IMAGE,
    officeRoom: 'Agri-Tech Pavilion · Room 115',
  },
  {
    id: 'teacher-anushka',
    name: 'Mrs. Anushka Gunasekara',
    role: 'GIS & Geography Specialist',
    department: 'Geography',
    qualifications: 'M.Sc. in Geoinformatics, B.A. (Hons) Geography',
    bio: 'Guides student research in drone photogrammetry, flood-risk GIS mapping, and meteorological data logging.',
    photoUrl: AGRI_GEO_IMAGE,
    officeRoom: 'Spatial Lab · Room 214',
  },
];

export const DEFAULT_STUDENTS: Omit<Student, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'student-senura',
    fullName: 'Senura Bandara',
    gradeLevel: 'Grade 13',
    stream: 'Engineering Technology',
    roleTitle: 'President, Robotics & Mechatronics Guild',
    achievementsSummary:
      'Led the 5-member team that won Gold at the National Autonomous Rover Challenge 2026.',
    photoUrl: ENGINEERING_LAB_IMAGE,
    graduationYear: '2026',
    featured: true,
  },
  {
    id: 'student-nethmi',
    fullName: 'Nethmi Wickramasinghe',
    gradeLevel: 'Grade 13',
    stream: 'Bio Systems Technology',
    roleTitle: 'Lead Researcher, Hydroponic Telemetry Lab',
    achievementsSummary:
      'Designed an automated nutrient-dosing controller reducing water usage by 38% in greenhouse trials.',
    photoUrl: SCIENCE_BIO_IMAGE,
    graduationYear: '2026',
    featured: true,
  },
  {
    id: 'student-ashan',
    fullName: 'Ashan De Silva',
    gradeLevel: 'Grade 12',
    stream: 'Engineering Technology',
    roleTitle: 'Lead Developer, Campus ICT Systems',
    achievementsSummary:
      'Built the open-source GIS flood alert dashboard and won Best Systems Architecture at Youth Code Summit.',
    photoUrl: ICT_STUDIO_IMAGE,
    graduationYear: '2027',
    featured: true,
  },
  {
    id: 'student-hiruni',
    fullName: 'Hiruni Jayasinghe',
    gradeLevel: 'Grade 12',
    stream: 'Bio Systems Technology',
    roleTitle: 'Vice President, Agri-Geo Innovation Circle',
    achievementsSummary:
      'Authored a regional watershed mapping study using UAV multispectral imagery and QGIS.',
    photoUrl: AGRI_GEO_IMAGE,
    graduationYear: '2027',
    featured: true,
  },
];

export const DEFAULT_EVENTS: Omit<CampusEvent, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'event-innovate-2026',
    title: 'Annual Technology & Robotics Exhibition 2026',
    category: 'Exhibition',
    eventDate: '2026-12-04',
    startTime: '09:00',
    timeLabel: '09:00 AM – 04:30 PM',
    location: 'SSCK TECH Main Atrium & Engineering Bays',
    description:
      'Flagship annual showcase featuring 45+ live student engineering prototypes, autonomous rovers, smart farming pods, and GIS spatial demonstrations open to parents and partner universities.',
    imageUrl: HERO_CAMPUS_IMAGE,
    isUpcoming: true,
    registrationLink: '',
  },
  {
    id: 'event-gis-bootcamp',
    title: 'UAV Drone Mapping & QGIS Intensive Workshop',
    category: 'Workshop',
    eventDate: '2026-11-26',
    startTime: '13:30',
    timeLabel: '01:30 PM – 04:00 PM',
    location: 'Spatial Lab · Room 214',
    description:
      'Hands-on field flight calibration and orthomosaic terrain processing session for Grade 12 & 13 Geography and Agriculture students.',
    imageUrl: AGRI_GEO_IMAGE,
    isUpcoming: true,
    registrationLink: '',
  },
  {
    id: 'event-cnc-hackathon',
    title: 'Mechatronics & Rapid Prototyping Sprint',
    category: 'Competition',
    eventDate: '2026-10-18',
    startTime: '08:30',
    timeLabel: '08:30 AM – 05:00 PM',
    location: 'Engineering Workshop Bay 1',
    description:
      'Eight-hour design-build challenge where student teams engineered line-following load carriers using laser-cut chassis and PID motor controllers.',
    imageUrl: ENGINEERING_LAB_IMAGE,
    isUpcoming: false,
    registrationLink: '',
  },
];

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ach-robotics-gold',
    title: '1st Place — National Schools Autonomous Robotics Championship',
    category: 'Engineering & Robotics',
    awardLevel: 'National',
    tier: 'Gold',
    iconType: 'trophy',
    year: '2026',
    awardDate: '2026-09-18',
    recipients: 'ET Senior Robotics Squad (Grade 13)',
    description:
      'Engineered an all-terrain vision-guided rescue rover using custom CNC aluminum framing and real-time LiDAR obstacle avoidance.',
    imageUrl: ENGINEERING_LAB_IMAGE,
    featured: true,
  },
  {
    id: 'ach-biotech-silver',
    title: 'Platinum Honor — International Youth Bio-Innovation Olympiad',
    category: 'Bio Systems Technology',
    awardLevel: 'International',
    tier: 'Platinum',
    iconType: 'medal',
    year: '2026',
    awardDate: '2026-07-24',
    recipients: 'Nethmi Wickramasinghe & BST Research Team',
    description:
      'Recognized globally for developing a low-cost biodegradable food-spoilage optical biosensor from natural anthocyanin extracts.',
    imageUrl: SCIENCE_BIO_IMAGE,
    featured: true,
  },
  {
    id: 'ach-ict-merit',
    title: 'All-Island Best Cloud & IoT Architecture Certificate',
    category: 'ICT & Software',
    awardLevel: 'National',
    tier: 'Silver',
    iconType: 'certificate',
    year: '2025',
    awardDate: '2025-11-12',
    recipients: 'ICT Studio Cohort',
    description:
      'Awarded for an open-telemetry campus solar microgrid monitoring portal built with real-time edge sensors.',
    imageUrl: ICT_STUDIO_IMAGE,
    featured: true,
  },
  {
    id: 'ach-agri-bronze',
    title: 'Provincial Smart Hydroponics & Precision Geo Award',
    category: 'Agriculture & GIS',
    awardLevel: 'Provincial',
    tier: 'Bronze',
    iconType: 'award',
    year: '2025',
    awardDate: '2025-08-05',
    recipients: 'Agri-Tech & Geo Mapping Unit',
    description:
      'Commended for automated EC/pH nutrient dosing paired with drone NDVI crop stress mapping across the school botanical plot.',
    imageUrl: HERO_CAMPUS_IMAGE,
    featured: false,
  },
];

export const DEFAULT_ANNOUNCEMENTS: Omit<Announcement, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ann-exhibition-call',
    title: 'Prototype Submissions Open for Tech Exhibition 2026',
    summary:
      'All Grade 12 and 13 project teams must register hardware schematics and safety sheets by November 25.',
    body: 'Project teams across ET, BST, ICT, Agriculture, and Geography are invited to finalize their booth layouts and electrical safety checklists with Eng. Nalin Rathnayake prior to the December 4 exhibition.',
    imageUrl: HERO_CAMPUS_IMAGE,
    priority: 'urgent',
    publishDate: '2026-11-14',
    pinnedToHome: true,
    showAsPopup: true,
    authorName: 'Dr. Kavinda Wijesekera',
  },
  {
    id: 'ann-sft-papers',
    title: '2026 Term III SFT & ET Structured Past Paper Packs Published',
    summary:
      'Updated marking schemes and laboratory calibration guides are now available in the Downloads center.',
    body: 'Students preparing for Term III assessments can download the verified PDF practice sets and video walkthrough notes from the Downloads page.',
    imageUrl: '',
    priority: 'important',
    publishDate: '2026-11-10',
    pinnedToHome: true,
    authorName: 'Technology Academic Board',
  },
  {
    id: 'ann-lab-hours',
    title: 'Extended Afternoon Lab Access for Capstone Builds',
    summary:
      'CNC Workshop Bay 1 and Computing Studio 204 remain open until 5:00 PM on Tuesdays and Thursdays.',
    body: 'Supervised workshop access is available to registered capstone groups with faculty sign-off.',
    imageUrl: '',
    priority: 'general',
    publishDate: '2026-11-05',
    pinnedToHome: false,
    authorName: 'Workshop Operations',
  },
];

export const DEFAULT_GALLERY: Omit<GalleryItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'gal-atrium',
    title: 'SSCK TECH Innovation Atrium during Robotics Trials',
    category: 'Campus & Labs',
    mediaType: 'image',
    mediaUrl: HERO_CAMPUS_IMAGE,
    description: 'Students collaborating across multi-level robotics and AI navigation benches.',
    capturedDate: '2026-11-02',
  },
  {
    id: 'gal-cnc-bay',
    title: '3-Axis CNC Milling & Oscilloscope Diagnostics',
    category: 'Engineering',
    mediaType: 'image',
    mediaUrl: ENGINEERING_LAB_IMAGE,
    description: 'Precision aluminum chassis fabrication and motor driver signal verification.',
    capturedDate: '2026-10-21',
  },
  {
    id: 'gal-biotech',
    title: 'Spectrophotometry & Tissue Culture Session',
    category: 'Bio Systems',
    mediaType: 'image',
    mediaUrl: SCIENCE_BIO_IMAGE,
    description: 'Grade 13 BST learners conducting quantitative optical absorbance assays.',
    capturedDate: '2026-10-14',
  },
  {
    id: 'gal-ict-studio',
    title: 'Network Architecture & Server Rack Simulation',
    category: 'Computing',
    mediaType: 'image',
    mediaUrl: ICT_STUDIO_IMAGE,
    description: 'Dual-display systems engineering lab connected to the glass-enclosed fiber rack.',
    capturedDate: '2026-09-29',
  },
  {
    id: 'gal-agri-drone',
    title: 'Autonomous Agri-Drone & Hydroponic Sensor Array',
    category: 'Agri & GIS',
    mediaType: 'image',
    mediaUrl: AGRI_GEO_IMAGE,
    description: 'Integration of UAV elevation mapping with vertical hydroponic nutrient telemetry.',
    capturedDate: '2026-09-18',
  },
];

export const DEFAULT_PROJECTS: Omit<StudentProject, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'proj-rover',
    title: 'Sentinel-4 Autonomous Rescue Rover',
    subjectCode: 'ET',
    studentTeam: 'Senura Bandara, Kavishka Silva, Malith Fernando',
    year: '2026',
    summary:
      'CNC-machined 4WD articulated rover equipped with thermal imaging and autonomous waypoint navigation.',
    technicalDetails:
      'Constructed using 6061 aluminum extrusion, brushless planetary gearmotors, STM32 flight/drive controller, and a Raspberry Pi vision co-processor running real-time obstacle segmentation.',
    imageUrl: ENGINEERING_LAB_IMAGE,
    demoUrl: '',
    featured: true,
  },
  {
    id: 'proj-hydroponic',
    title: 'Closed-Loop Smart Hydroponic & EC Controller',
    subjectCode: 'BST',
    studentTeam: 'Nethmi Wickramasinghe, Dinithi Perera',
    year: '2026',
    summary:
      'Automated vertical farming rig balancing pH, electrical conductivity, and full-spectrum LED photoperiods.',
    technicalDetails:
      'Uses peristaltic dosing pumps calibrated via optical turbidity and ion-selective probes, reducing freshwater consumption by 38% compared to soil plots.',
    imageUrl: AGRI_GEO_IMAGE,
    demoUrl: '',
    featured: true,
  },
  {
    id: 'proj-watershed',
    title: 'UAV Watershed & Flood Risk GIS Atlas',
    subjectCode: 'GEO',
    studentTeam: 'Hiruni Jayasinghe, Ashan De Silva',
    year: '2026',
    summary:
      'High-resolution digital elevation model and runoff simulation for regional school catchment zones.',
    technicalDetails:
      'Combines RTK drone photogrammetry orthomosaics with QGIS hydrological flow accumulation modeling and live campus rain-gauge telemetry.',
    imageUrl: ICT_STUDIO_IMAGE,
    demoUrl: '',
    featured: true,
  },
];

export const DEFAULT_DOWNLOADS: Omit<DownloadResource, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'dl-sft-syllabus',
    title: 'Science for Technology (SFT) Complete Competency Syllabus',
    subjectCode: 'SFT',
    resourceType: 'Syllabus',
    fileFormat: 'Drive',
    fileSizeLabel: '4.2 MB',
    fileUrl: 'https://drive.google.com/',
    description: 'Official curriculum breakdown, practical rubric, and laboratory apparatus standards.',
  },
  {
    id: 'dl-et-cad-manual',
    title: 'Engineering Technology CAD & CNC Safety Manual',
    subjectCode: 'ET',
    resourceType: 'Lab Manual',
    fileFormat: 'PDF',
    fileSizeLabel: '6.8 MB',
    fileUrl: 'https://drive.google.com/',
    description: 'Step-by-step G-code setup, micrometer tolerances, and workshop PPE protocols.',
  },
  {
    id: 'dl-ict-sql-guide',
    title: 'ICT Relational Database & Python Revision Pack',
    subjectCode: 'ICT',
    resourceType: 'Study Guide',
    fileFormat: 'PDF',
    fileSizeLabel: '3.1 MB',
    fileUrl: 'https://drive.google.com/',
    description: 'ER diagrams, 3NF normalization exercises, and Python algorithmic problem sets.',
  },
  {
    id: 'dl-bst-protocol',
    title: 'Bio Systems Aseptic Culture & Water Assay Protocol',
    subjectCode: 'BST',
    resourceType: 'Lab Manual',
    fileFormat: 'Drive',
    fileSizeLabel: '2.9 MB',
    fileUrl: 'https://drive.google.com/',
    description: 'Standard operating procedures for BOD/COD testing and plant micropropagation.',
  },
  {
    id: 'dl-agri-hydro',
    title: 'Precision Agriculture Nutrient Solution Dataset',
    subjectCode: 'AGRI',
    resourceType: 'Dataset',
    fileFormat: 'ZIP',
    fileSizeLabel: '1.5 MB',
    fileUrl: 'https://drive.google.com/',
    description: '6-month greenhouse EC, pH, and ambient VPD telemetry CSV dataset for student analysis.',
  },
  {
    id: 'dl-geo-gis',
    title: 'Geography QGIS Remote Sensing Exercise Workbook',
    subjectCode: 'GEO',
    resourceType: 'Past Paper',
    fileFormat: 'Drive',
    fileSizeLabel: '8.4 MB',
    fileUrl: 'https://drive.google.com/',
    description: 'Cartographic projection exercises, DEM contour labs, and past paper map extracts.',
  },
];

export const DEFAULT_HISTORY_EVENTS: Omit<HistoryMilestone, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'hist-early-inventions',
    year: 'c. 3500 BCE',
    era: 'Ancient Foundations',
    title: 'Early Inventions & Mechanical Tools',
    description:
      'Humanity’s first technological revolutions transformed raw earth into precision leverage: the potter’s wheel, bronze metallurgy, irrigation canals, Archimedean screws, watermills, and celestial astrolabes laid the empirical foundations of mechanical engineering and agriculture.',
    impactSummary:
      'Multiplied agricultural yields, standardized trade transport, and established the six classical simple machines.',
    imageUrl: AGRI_GEO_IMAGE,
    order: 1,
  },
  {
    id: 'hist-printing-press',
    year: '1440',
    era: 'Knowledge Revolution',
    title: 'The Invention of the Printing Press',
    description:
      'Johannes Gutenberg engineered durable metal movable type, oil-based inks, and a modified screw press in Mainz. Scientific diagrams, mathematical tables, and engineering treatises could now be reproduced with precision rather than copied by hand.',
    impactSummary:
      'Accelerated literacy across continents and sparked the Scientific Revolution by making peer-reviewed knowledge public.',
    imageUrl: HISTORY_PRINTING_PRESS_IMAGE,
    order: 2,
  },
  {
    id: 'hist-telephone',
    year: '1876',
    era: 'Telecommunications',
    title: 'The Invention of the Telephone',
    description:
      'Alexander Graham Bell demonstrated how acoustic voice vibrations could modulate electrical current across copper conductors, converting sound waves into continuous analog signals and back into speech in real time.',
    impactSummary:
      'Replaced physical dispatch delays with instant human voice networks, establishing modern electrical signal engineering.',
    imageUrl: HISTORY_TELEPHONE_IMAGE,
    order: 3,
  },
  {
    id: 'hist-first-computers',
    year: '1936 – 1946',
    era: 'Electronic Computing',
    title: 'The First Electronic Computers',
    description:
      'From Alan Turing’s formalization of universal computation to Colossus and ENIAC—with nearly 18,000 vacuum tubes—engineers proved that stored binary instructions could solve artillery ballistics, cryptography, and scientific modeling at electronic speeds.',
    impactSummary:
      'Transitioned calculation from mechanical gears to programmable digital logic, paving the way for the transistor and silicon microchip.',
    imageUrl: HISTORY_FIRST_COMPUTER_IMAGE,
    order: 4,
  },
  {
    id: 'hist-internet',
    year: '1969 – 1991',
    era: 'Global Networking',
    title: 'The Development of the Internet & Web',
    description:
      'Beginning with ARPANET packet switching, Vint Cerf and Bob Kahn’s TCP/IP protocol suite united disparate networks into a fault-tolerant global fabric, before Tim Berners-Lee introduced HTTP, HTML, and URLs at CERN.',
    impactSummary:
      'Created an open, decentralized global information commons connecting billions of laboratories, schools, and servers.',
    imageUrl: ICT_STUDIO_IMAGE,
    order: 5,
  },
  {
    id: 'hist-mobile-phones',
    year: '1973 – 2007',
    era: 'Mobile Era',
    title: 'The Evolution of Mobile Phones',
    description:
      'What began with Martin Cooper’s 1.1-kilogram handheld cellular prototype evolved through digital GSM networks, Lithium-ion batteries, and GPS silicon into capacitive touchscreen smartphones carrying supercomputer-class ARM processors.',
    impactSummary:
      'Put high-speed internet, high-definition optics, and pocket computing tools directly into the hands of over 5 billion people.',
    imageUrl: HISTORY_INTERNET_MOBILE_IMAGE,
    order: 6,
  },
  {
    id: 'hist-artificial-intelligence',
    year: '1956 – Present',
    era: 'Machine Intelligence',
    title: 'Artificial Intelligence & Deep Learning',
    description:
      'Born at the 1956 Dartmouth Workshop, AI evolved from symbolic rule systems and backpropagation neural networks into GPU-accelerated transformers capable of protein folding, medical diagnostics, natural language reasoning, and multimodal synthesis.',
    impactSummary:
      'Transformed software from deterministic instructions into adaptive systems that perceive, reason, and assist scientific discovery.',
    imageUrl: SCIENCE_BIO_IMAGE,
    order: 7,
  },
  {
    id: 'hist-robotics-future',
    year: '2020s – Future',
    era: 'Autonomous Frontier',
    title: 'Modern Robotics & Future Technology',
    description:
      'Today’s frontier unites actuator mechatronics, spatial LiDAR perception, quantum error-corrected processors, synthetic bio-systems, and closed-loop precision agriculture—empowering students and engineers to tackle climate resilience and space exploration.',
    impactSummary:
      'Merges physical robotics, clean energy, and biotechnology into sustainable autonomous infrastructure for the next century.',
    imageUrl: HISTORY_AI_ROBOTICS_IMAGE,
    order: 8,
  },
];

export const EXECUTIVE_POSITIONS: ExecutivePosition[] = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Chief Organizer',
  'Media Coordinator',
  'Technical Coordinator',
  'Committee Member',
  'General Community Member',
];

export const MEMBER_ARCHIVE_YEARS = ['2024', '2025', '2026', '2027', '2028'] as const;

export const DEFAULT_COMMUNITY_DIRECTORY: Omit<
  CommunityDirectoryMember,
  'createdAt' | 'updatedAt'
>[] = [
  {
    id: 'exec-president',
    fullName: 'Senura Bandara',
    position: 'President',
    year: '2026',
    bio: 'Leads the SSCK TECH Executive Committee, robotics research initiatives, and inter-school technology symposiums.',
    photoUrl: ENGINEERING_LAB_IMAGE,
    secondaryPhotoUrl: HISTORY_AI_ROBOTICS_IMAGE,
    memberCode: 'SSCK-EX-001',
    isExecutive: true,
    order: 1,
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 'exec-vice-president',
    fullName: 'Nethmi Wickramasinghe',
    position: 'Vice President',
    year: '2026',
    bio: 'Directs Bio Systems innovation projects, laboratory mentorship programs, and science Olympiad preparation.',
    photoUrl: SCIENCE_BIO_IMAGE,
    secondaryPhotoUrl: AGRI_GEO_IMAGE,
    memberCode: 'SSCK-EX-002',
    isExecutive: true,
    order: 2,
    socialLinks: {
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 'exec-secretary',
    fullName: 'Ashan De Silva',
    position: 'Secretary',
    year: '2026',
    bio: 'Coordinates executive council documentation, community events, and digital systems across SSCK TECH.',
    photoUrl: ICT_STUDIO_IMAGE,
    secondaryPhotoUrl: HERO_CAMPUS_IMAGE,
    memberCode: 'SSCK-EX-003',
    isExecutive: true,
    order: 3,
    socialLinks: {
      github: 'https://github.com',
      website: 'https://github.com',
    },
  },
  {
    id: 'exec-treasurer',
    fullName: 'Hiruni Jayasinghe',
    position: 'Treasurer',
    year: '2025',
    bio: 'Oversees hardware lab prototyping budgets, competition sponsorships, and GIS field expedition logistics.',
    photoUrl: AGRI_GEO_IMAGE,
    secondaryPhotoUrl: HERO_CAMPUS_IMAGE,
    memberCode: 'SSCK-EX-004',
    isExecutive: true,
    order: 4,
    socialLinks: {
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: 'exec-tech-coordinator',
    fullName: 'Kavishka Silva',
    position: 'Technical Coordinator',
    year: '2025',
    bio: 'Manages embedded systems workshops, CNC safety briefings, and computing lab deployments.',
    photoUrl: ENGINEERING_LAB_IMAGE,
    secondaryPhotoUrl: ICT_STUDIO_IMAGE,
    memberCode: 'SSCK-EX-005',
    isExecutive: true,
    order: 5,
  },
  {
    id: 'exec-media-coordinator',
    fullName: 'Dinithi Perera',
    position: 'Media Coordinator',
    year: '2024',
    bio: 'Produces digital documentation, exhibition media coverage, and SSCK TECH community announcements.',
    photoUrl: ICT_STUDIO_IMAGE,
    secondaryPhotoUrl: SCIENCE_BIO_IMAGE,
    memberCode: 'SSCK-EX-006',
    isExecutive: true,
    order: 6,
  },
  {
    id: 'member-malith',
    fullName: 'Malith Fernando',
    position: 'General Community Member',
    year: '2024',
    bio: 'Active contributor to autonomous rover chassis engineering and CAD prototyping sessions.',
    photoUrl: HERO_CAMPUS_IMAGE,
    secondaryPhotoUrl: ENGINEERING_LAB_IMAGE,
    memberCode: 'SSCK-CM-104',
    isExecutive: false,
    order: 20,
  },
];

