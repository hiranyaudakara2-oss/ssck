import type { Timestamp } from 'firebase/firestore';

export type PageRoute =
  | 'home'
  | 'about'
  | 'subjects'
  | 'history'
  | 'community'
  | 'teachers'
  | 'students'
  | 'community-members'
  | 'teachers-members'
  | 'events'
  | 'achievements'
  | 'gallery'
  | 'projects'
  | 'downloads'
  | 'contact'
  | 'admin';

export interface SiteSocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

export interface SiteSettings {
  id?: string;
  siteTitle: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBannerUrl?: string;
  logoUrl?: string;
  floatingWidgetImageUrl?: string;
  aboutMission: string;
  aboutVision: string;
  footerAddress?: string;
  footerEmail?: string;
  footerPhone?: string;
  footerCopyright?: string;
  statsStudents?: number;
  statsProjects?: number;
  statsAwards?: number;
  statsPassRate?: number;
  statsVisitors?: number;
  maintenanceMode?: boolean;
  maintenanceAnnouncement?: string;
  maintenanceExpectedTime?: string;
  socialLinks?: SiteSocialLinks;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrl?: string;
  headTeacherName?: string;
  headTeacherTitle?: string;
  labFacilities?: string;
  curriculumHighlights?: string[];
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Teacher {
  id: string;
  name: string;
  role: string;
  department: string;
  qualifications?: string;
  bio?: string;
  photoUrl?: string;
  officeRoom?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Student {
  id: string;
  fullName: string;
  gradeLevel: string;
  stream: string;
  roleTitle?: string;
  achievementsSummary?: string;
  photoUrl?: string;
  graduationYear?: string;
  featured: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type EventStatus = 'scheduled' | 'live' | 'cancelled' | 'closed';

export interface CampusEvent {
  id: string;
  title: string;
  category: string;
  eventDate: string;
  startTime?: string;
  timeLabel?: string;
  location: string;
  description?: string;
  imageUrl?: string;
  isUpcoming: boolean;
  status?: EventStatus;
  cancellationReason?: string;
  liveStreamUrl?: string;
  registrationLink?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type AchievementTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type AchievementIconType = 'trophy' | 'medal' | 'certificate' | 'award';

export interface Achievement {
  id: string;
  title: string;
  category: string;
  awardLevel: 'International' | 'National' | 'Provincial' | 'School';
  tier?: AchievementTier;
  iconType?: AchievementIconType;
  year: string;
  awardDate?: string;
  recipients?: string;
  description?: string;
  imageUrl?: string;
  galleryImages?: string[];
  featured: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  body?: string;
  imageUrl?: string;
  priority: 'urgent' | 'important' | 'general';
  publishDate: string;
  pinnedToHome: boolean;
  showAsPopup?: boolean;
  authorName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  description?: string;
  capturedDate?: string;
  driveUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudentProject {
  id: string;
  title: string;
  subjectCode: string;
  studentTeam: string;
  year: string;
  summary: string;
  technicalDetails?: string;
  imageUrl?: string;
  demoUrl?: string;
  featured: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DownloadResource {
  id: string;
  title: string;
  subjectCode: string;
  resourceType: 'Syllabus' | 'Past Paper' | 'Lab Manual' | 'Study Guide' | 'Dataset';
  fileFormat: 'PDF' | 'Drive' | 'DOCX' | 'ZIP' | 'Link';
  fileSizeLabel?: string;
  fileUrl: string;
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'member' | 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive';
  department?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommunityMember {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  role: 'member' | 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive';
  department?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ExecutivePosition =
  | 'President'
  | 'Vice President'
  | 'Secretary'
  | 'Assistant Secretary'
  | 'Treasurer'
  | 'Assistant Treasurer'
  | 'Chief Organizer'
  | 'Media Coordinator'
  | 'Technical Coordinator'
  | 'Committee Member'
  | 'General Community Member';

export interface MemberSocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

export interface CommunityDirectoryMember {
  id: string;
  fullName: string;
  position: ExecutivePosition;
  year: string;
  bio: string;
  photoUrl?: string;
  secondaryPhotoUrl?: string;
  memberCode?: string;
  isExecutive: boolean;
  order: number;
  socialLinks?: MemberSocialLinks;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CustomLinkTarget =
  | 'home-hero'
  | 'home-showcase'
  | 'subjects'
  | 'downloads'
  | 'community'
  | 'history'
  | 'contact'
  | 'footer';

export type CustomLinkIcon =
  | 'globe'
  | 'book'
  | 'code'
  | 'cpu'
  | 'video'
  | 'file'
  | 'sparkles'
  | 'external-link';

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  targetSection: CustomLinkTarget;
  icon?: CustomLinkIcon | string;
  attachToElement?: string;
  order: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminLog {
  id: string;
  action: string;
  targetCollection: string;
  targetTitle: string;
  adminUid: string;
  adminName: string;
  createdAt?: Timestamp;
}

export interface ContactMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface HistoryMilestone {
  id: string;
  year: string;
  era: string;
  title: string;
  description: string;
  impactSummary?: string;
  imageUrl?: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CommunityCategory =
  | 'Engineering'
  | 'ICT & AI'
  | 'Bio-Systems'
  | 'Agri & Geo'
  | 'Robotics'
  | 'General Tech';

export interface CommunityPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string;
  category: CommunityCategory;
  title: string;
  content: string;
  imageUrl?: string;
  pinned: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CommunityComment {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  authorPhotoUrl?: string;
  body: string;
  createdAt?: Timestamp;
}

export interface CommunityLike {
  id: string;
  uid: string;
  createdAt?: Timestamp;
}

export interface HeroSlide {
  id: string;
  imageUrl: string;
  caption: string;
  subtitle?: string;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
