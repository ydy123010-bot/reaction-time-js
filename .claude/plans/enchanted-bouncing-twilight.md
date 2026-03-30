# PPPTX SaaS Implementation Plan

## Executive Summary

Transform Open-SaaS template into a worship presentation SaaS by integrating ppptx (presentation generator) as the core product. Replace demo-ai-app with ppptx functionality, add cloud storage, implement freemium model with in-screen presentation viewer, and build custom template system.

---

## Product Vision

**Target Market:** Churches, worship teams, and ministries
**Core Value:** Convert worship lyrics to PowerPoint presentations in seconds
**Monetization:** Free tier (5 presentations/month) + paid subscriptions (Worship: $9.99, Ministry: $19.99)

---

## Implementation Roadmap

### Phase 1: MVP - Basic PPPTX Integration (Week 1-2)

**Goal:** Replace demo-ai-app with working presentation generator

#### 1. Database Schema Updates

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/schema.prisma`

**Actions:**

- Add Presentation model (stores generated presentations)
- Add Template model (system + user templates)
- Update User model with presentation relations
- Remove GptResponse and Task models

**New Models:**

```prisma
model Presentation {
  id                String          @id @default(uuid())
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  user              User            @relation(fields: [userId], references: [id])
  userId            String

  name              String
  description       String?
  lyricsText        String          @db.Text
  slideCount        Int

  caseTransform     String          @default("unmodified")
  verticalAlign     String          @default("middle")

  template          Template?       @relation(fields: [templateId], references: [id])
  templateId        String?
  customTheme       Json?

  s3Key             String
  fileSize          Int?

  isPublic          Boolean         @default(false)
  shareToken        String?         @unique
  viewCount         Int             @default(0)

  tags              String[]
  isFavorite        Boolean         @default(false)

  @@index([userId, createdAt])
  @@index([userId, isFavorite])
}

model Template {
  id                String          @id @default(uuid())
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  user              User?           @relation(fields: [userId], references: [id])
  userId            String?

  name              String
  description       String?
  isSystemTemplate  Boolean         @default(false)
  isPublic          Boolean         @default(false)
  isPremium         Boolean         @default(false)

  theme             Json
  previewImageS3Key String?
  useCount          Int             @default(0)

  presentations     Presentation[]

  @@index([userId])
  @@index([isSystemTemplate, isPremium])
}

// Add to User model:
model User {
  // ... existing fields ...
  presentations     Presentation[]
  templates         Template[]
}
```

**Migration:**

```bash
wasp db migrate-dev --name add_presentations_tables
# Then remove demo-ai-app models
wasp db migrate-dev --name remove_demo_app_tables
```

#### 2. Backend - Server-Side Generation

**Create:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/`

**Key Files to Create:**

**`operations.ts`** - Core backend logic

```typescript
// Actions
export const generatePresentation: GeneratePresentation
  - Validate user subscription/limits (enforce 5/month for free)
  - Port logic from /Users/jasonhwang/src/jh-projects/ppptx-client-only/src/utils/pptxGenerator.ts
  - Generate PPTX server-side using pptxgenjs
  - Upload to S3 (pattern from /app/src/file-upload/operations.ts)
  - Save Presentation record to database
  - Return download URL

export const getAllPresentationsByUser: GetAllPresentationsByUser
  - Query presentations with pagination
  - Include template relations

export const getPresentationById: GetPresentationById
  - Return presentation with presigned S3 download URL

export const deletePresentation: DeletePresentation
  - Delete from DB and S3
```

**`s3Utils.ts`** - S3 operations (follow pattern from `/app/src/file-upload/s3Utils.ts`)

```typescript
- Store at: {userId}/presentations/{uuid}.pptx
- Generate presigned download URLs (1 hour expiry)
```

**`limits.ts`** - Usage limit enforcement

```typescript
export async function enforceGenerationLimit(
  user: User,
  context
): Promise<void> {
  if (isUserSubscribed(user)) return; // Unlimited

  const thisMonth = startOfCurrentMonth();
  const count = await context.entities.Presentation.count({
    where: { userId: user.id, createdAt: { gte: thisMonth } },
  });

  if (count >= 5) {
    throw new HttpError(
      402,
      "Monthly limit reached. Upgrade to Pro for unlimited."
    );
  }
}
```

**`validation.ts`** - Zod schemas for input validation

**Dependencies:**

```bash
cd app
npm install pptxgenjs@^3.12.0
```

#### 3. Wasp Configuration

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/main.wasp`

**Actions:**

- Add presentation routes and pages
- Add actions and queries
- Remove demo-ai-app declarations
- Update auth redirect to `/presentations/new`

**Add:**

```wasp
route CreatePresentationRoute { path: "/presentations/new", to: CreatePresentationPage }
page CreatePresentationPage {
  authRequired: true,
  component: import CreatePresentationPage from "@src/presentations/CreatePresentationPage"
}

route PresentationsRoute { path: "/presentations", to: PresentationsPage }
page PresentationsPage {
  authRequired: true,
  component: import PresentationsPage from "@src/presentations/PresentationsPage"
}

action generatePresentation {
  fn: import { generatePresentation } from "@src/presentations/operations",
  entities: [User, Presentation]
}

query getAllPresentationsByUser {
  fn: import { getAllPresentationsByUser } from "@src/presentations/operations",
  entities: [Presentation]
}

query getPresentationById {
  fn: import { getPresentationById } from "@src/presentations/operations",
  entities: [Presentation]
}
```

**Remove:**

```wasp
// Delete all demo-ai-app routes, pages, actions, queries
// (DemoAppRoute, DemoAppPage, generateGptResponse, createTask, etc.)
```

**Update:**

```wasp
auth: {
  // ...
  onAuthSucceededRedirectTo: "/presentations/new",
}
```

#### 4. Frontend - Creation Page

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/CreatePresentationPage.tsx`

**Port from:** `/Users/jasonhwang/src/jh-projects/ppptx-client-only/src/App.tsx`

**Components:**

- Large textarea for lyrics (placeholder: "Paste your worship lyrics here...")
- ConfigPanel for case transform and vertical alignment
- Filename input
- "Generate PowerPoint" button
- Usage banner showing remaining presentations
- Success state with download link

**Wire to backend:**

```typescript
import { generatePresentation } from "wasp/client/operations";

const handleGenerate = async () => {
  const result = await generatePresentation({
    lyricsText,
    name: fileName || "presentation",
    caseTransform,
    verticalAlign,
  });
  // Show download link
};
```

#### 5. Navigation Updates

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/client/components/NavBar/constants.ts`

**Update:**

```typescript
export const appNavigationItems: NavigationItem[] = [
  { name: "Create", to: "/presentations/new" },
  { name: "Library", to: "/presentations" },
  { name: "Pricing", to: "/pricing" },
];
```

#### 6. Cleanup Demo-AI-App

**Delete:**

- `/Users/jasonhwang/src/jh-projects/ppptx/app/src/demo-ai-app/` (entire folder)

---

### Phase 2: Presentation Library (Week 3)

**Goal:** View, manage, and re-download presentations

#### Frontend Components

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/PresentationsPage.tsx`

**Features:**

- Grid view of presentation cards
- Search by name
- Filter by tags, favorites
- Sort by date/name
- Delete with confirmation
- Download button per card

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/components/PresentationCard.tsx`

**Display:**

- Presentation name
- Slide count
- Created date
- Download button
- Delete button
- Favorite toggle

#### Backend Queries

**Already planned in operations.ts:**

- `getAllPresentationsByUser` with pagination
- `deletePresentation` action

---

### Phase 3: Templates System (Week 4)

**Goal:** System templates + user-created templates (premium)

#### System Templates

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/templates/systemTemplates.ts`

**Define defaults:**

```typescript
export const systemTemplates = [
  {
    name: "Classic Worship",
    theme: {
      background: "#000000",
      textColor: "#FFFFFF",
      fontSize: 36,
      fontFamily: "Arial",
      bold: true,
    },
    isPremium: false,
  },
  {
    name: "Modern Gradient",
    theme: {
      background: "gradient",
      colors: ["#4A00E0", "#8E2DE2"],
      textColor: "#FFFFFF",
      fontSize: 40,
    },
    isPremium: true, // Requires paid subscription
  },
  // ... more templates
];
```

#### Frontend

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/components/TemplateSelector.tsx`

**Features:**

- Gallery view of templates
- Preview thumbnails
- Premium badge on paid templates
- Apply template to generation

#### Backend

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/templates/operations.ts`

```typescript
export const getAllTemplates: GetAllTemplates
  - Return all system templates + user's custom templates
  - Filter premium templates if user not subscribed

export const createCustomTemplate: CreateCustomTemplate (premium only)
  - Create user template
  - Upload preview image to S3
```

---

### Phase 4: In-Screen Presentation Viewer (Week 5)

**Goal:** Full-screen slide viewer in browser (no download needed)

#### Backend

**Update operations.ts:**

```typescript
export const sharePresentation: SharePresentation
  - Generate unique share token
  - Update presentation.shareToken, presentation.isPublic

export const getSharedPresentation: GetSharedPresentation
  - Public access via token (no auth required)
  - Return parsed slide data
```

#### Frontend

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/ViewPresentationPage.tsx`

**Route:** `/view/:shareToken` (public, no auth)

**Features:**

- Full-screen mode
- Parse lyricsText into slides
- Apply caseTransform and verticalAlign
- Keyboard navigation (arrow keys, spacebar)
- Slide counter (1/10)
- Exit button
- Black background with centered white text

**Premium Gate:**

- Free users see upgrade prompt
- Paid users can view in-browser + share link

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/components/PresentationViewer.tsx`

**Implementation:**

```typescript
// Render slides as HTML/CSS (not PPTX)
const slides = parseTextToSlides(lyricsText);
const [currentSlide, setCurrentSlide] = useState(0);

// Keyboard navigation
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === " ") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentSlide]);

return (
  <div className="fixed inset-0 bg-black flex items-center justify-center">
    <div className="text-white text-4xl text-center">
      {slides[currentSlide]}
    </div>
    <div className="absolute bottom-4 text-white">
      {currentSlide + 1} / {slides.length}
    </div>
  </div>
);
```

---

### Phase 5: Premium Features & Polish (Week 6)

#### 1. Payment Plans Update

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/payment/plans.ts`

**Update:**

```typescript
export enum PaymentPlanId {
  Hobby = "hobby", // Rename to "Worship"
  Pro = "pro", // Rename to "Ministry"
  // Remove Credits10
}

export interface PaymentPlanFeatures {
  presentationLimit: number | null;
  inScreenViewer: boolean;
  customTemplates: boolean;
  premiumTemplates: boolean;
  customBranding: boolean;
}

export const planFeatures: Record<PaymentPlanId, PaymentPlanFeatures> = {
  [PaymentPlanId.Hobby]: {
    presentationLimit: 50,
    inScreenViewer: true,
    customTemplates: false,
    premiumTemplates: true,
    customBranding: false,
  },
  [PaymentPlanId.Pro]: {
    presentationLimit: null, // unlimited
    inScreenViewer: true,
    customTemplates: true,
    premiumTemplates: true,
    customBranding: true,
  },
};
```

#### 2. Pricing Page Update

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/payment/PricingPage.tsx`

**Update cards:**

```typescript
Free Tier:
- 5 presentations/month
- Basic templates
- Download PPTX files
- 1 GB storage

Worship ($9.99/month):
- 50 presentations/month
- All premium templates
- In-screen viewer
- Share presentations
- 10 GB storage

Ministry ($19.99/month):
- Unlimited presentations
- All premium templates
- Custom templates & branding
- In-screen viewer
- Share presentations
- Unlimited storage
- Priority support
```

#### 3. Feature Gating

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/featureGating.ts`

```typescript
export function canAccessInScreenViewer(user: User): boolean {
  return user.subscriptionPlan === "hobby" || user.subscriptionPlan === "pro";
}

export function canCreateCustomTemplates(user: User): boolean {
  return user.subscriptionPlan === "pro";
}

export function canAccessPremiumTemplates(user: User): boolean {
  return !!user.subscriptionPlan;
}
```

#### 4. Landing Page Updates

**File:** `/Users/jasonhwang/src/jh-projects/ppptx/app/src/landing-page/LandingPage.tsx`

**Update:**

- Hero: "Worship lyrics to PowerPoint in seconds"
- Features: Fast generation, beautiful templates, in-screen viewer
- CTA: "Start Creating Presentations"
- Testimonials: Church/worship team use cases

#### 5. Organization Features

**Add to PresentationsPage:**

- Tags input (comma-separated)
- Favorite toggle
- Filter by favorites
- Search by tags

---

## File Structure Summary

```
/app/src/
├── presentations/                    # NEW
│   ├── CreatePresentationPage.tsx
│   ├── PresentationsPage.tsx
│   ├── ViewPresentationPage.tsx
│   ├── operations.ts
│   ├── s3Utils.ts
│   ├── limits.ts
│   ├── validation.ts
│   ├── featureGating.ts
│   ├── components/
│   │   ├── PresentationCard.tsx
│   │   ├── PresentationViewer.tsx
│   │   ├── ConfigPanel.tsx          # Port from ppptx-client-only
│   │   ├── TemplateSelector.tsx
│   │   └── UsageBanner.tsx
│   ├── templates/
│   │   ├── TemplatesPage.tsx
│   │   ├── operations.ts
│   │   └── systemTemplates.ts
│   └── hooks/
│       ├── usePresentations.ts
│       └── useUsageLimit.ts
├── payment/                          # UPDATE
│   ├── plans.ts                     # Update plan configs
│   └── PricingPage.tsx              # Update pricing cards
├── landing-page/                     # UPDATE
│   └── LandingPage.tsx              # Update content
├── client/components/NavBar/         # UPDATE
│   └── constants.ts                 # Update nav items
└── demo-ai-app/                      # DELETE
```

---

## Critical Files Reference

### Must Modify

1. `/Users/jasonhwang/src/jh-projects/ppptx/app/schema.prisma` - Add models
2. `/Users/jasonhwang/src/jh-projects/ppptx/app/main.wasp` - Add routes/actions
3. `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/operations.ts` - Backend logic
4. `/Users/jasonhwang/src/jh-projects/ppptx/app/src/presentations/CreatePresentationPage.tsx` - Main UI
5. `/Users/jasonhwang/src/jh-projects/ppptx/app/src/payment/plans.ts` - Update plans

### Port From ppptx-client-only

1. `/Users/jasonhwang/src/jh-projects/ppptx-client-only/src/utils/pptxGenerator.ts` → Server operations
2. `/Users/jasonhwang/src/jh-projects/ppptx-client-only/src/components/ConfigPanel.tsx` → Reuse
3. `/Users/jasonhwang/src/jh-projects/ppptx-client-only/src/App.tsx` → Adapt for CreatePresentationPage

### Delete

1. `/Users/jasonhwang/src/jh-projects/ppptx/app/src/demo-ai-app/` - Entire folder

---

## Technical Decisions

### Server-Side Generation

**Why:** Better control, accurate limits, enables premium features (custom fonts/logos)
**How:** Port pptxgenjs logic to server, generate in-memory, upload to S3

### Monthly Limits (Not Credits)

**Why:** Clearer value ("5 presentations/month" vs "5 credits")
**How:** Count presentations per month in enforceGenerationLimit()

### In-Screen Viewer as HTML/CSS

**Why:** Full control, no external dependencies, premium feature gate
**How:** Render slides using same logic as PPTX but in React components

### Template Storage as JSON

**Why:** Flexible, extensible, no file parsing needed
**How:** Store theme configs as JSON in database

---

## Environment Variables

**Add to `.env.server`:**

```
PRESENTATIONS_MAX_FILE_SIZE_MB=50
PRESENTATIONS_FREE_MONTHLY_LIMIT=5
PRESENTATIONS_HOBBY_MONTHLY_LIMIT=50

# Update Stripe plan IDs
PAYMENTS_BASIC_SUBSCRIPTION_PLAN_ID=price_worship_xxx
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_ministry_xxx
```

---

## Testing Strategy

1. **Unit Tests:** Port existing tests from ppptx-client-only
2. **Integration:** E2E generation flow (create → download → view)
3. **Limits:** Verify free tier enforcement
4. **S3:** Mock S3 client in tests

---

## Post-Launch Enhancements

- Chord notation support for worship songs
- Bulk upload (multiple songs at once)
- Team collaboration (share templates, presentations)
- Background image uploads
- Custom fonts
- Presentation history analytics
- Mobile app for on-the-go generation

---

## Success Metrics

- User signups
- Presentations generated per user
- Conversion rate (free → paid)
- Monthly recurring revenue (MRR)
- User retention (30-day, 90-day)
- Feature usage (templates, in-screen viewer)
