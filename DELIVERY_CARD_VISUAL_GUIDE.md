# Delivery Reference Card - Visual Preview

## Card Layout Design

```
┌─────────────────────────────────────────────────────────────────┐
│ 📦 Delivery Reference                                           │
│ Target specifications for weighing process                     │
│                                                                 │
│ ┌─────────────────────┐  ┌─────────────────────┐               │
│ │   ITEM DETAILS      │  │   DELIVERY INFO     │               │
│ │                     │  │                     │               │
│ │ Product:            │  │ Delivery ID: #123   │               │
│ │ Rice - Premium      │  │ Status: 🚛 In Transit│               │
│ │                     │  │ Data Source:        │               │
│ │ Target Weight:      │  │ Marketing Data      │               │
│ │ 25.5 kg             │  │                     │               │
│ │                     │  │                     │               │
│ │ Supplier:           │  │                     │               │
│ │ ABC Supplier Co.    │  │                     │               │
│ └─────────────────────┘  └─────────────────────┘               │
│                                                                 │
│ 💡 Weighing Guidelines:                                         │
│ Use this target weight as reference. Variance ≥5% will         │
│ trigger review, ≥10% requires manager approval.                │
└─────────────────────────────────────────────────────────────────┘
```

## Color Scheme

- **Background**: Gradient blue (from-blue-50 to-indigo-50)
- **Border**: Blue-200
- **Icon Background**: White with shadow
- **Text**: Blue-900 (headers), Gray-900 (content)
- **Target Weight**: Blue-700 (highlighted)
- **Guidelines Box**: Blue-100 background

## Responsive Behavior

### Desktop (md and up):

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] 📦 Delivery Reference                                    │
│                                                                 │
│ ┌─────────────────────┐  ┌─────────────────────┐               │
│ │   ITEM DETAILS      │  │   DELIVERY INFO     │               │
│ │ (Left column)       │  │ (Right column)      │               │
│ └─────────────────────┘  └─────────────────────┘               │
│                                                                 │
│ 💡 Guidelines (Full width)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile:

```
┌─────────────────────────────────────┐
│ [Icon] 📦 Delivery Reference        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        ITEM DETAILS             │ │
│ │ (Full width)                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        DELIVERY INFO            │ │
│ │ (Full width)                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 💡 Guidelines (Full width)          │
└─────────────────────────────────────┘
```

## Interactive States

### 1. Hidden State (Default)

```
[Select Sample dropdown]
▼
(No card visible)
```

### 2. Visible State (Sample Selected)

```
[Select Sample dropdown: "Rice - Premium (Target: 25.5 kg)"]
▼
[Delivery Reference Card appears with smooth animation]
▼
[Weight from IoT Scale input field]
```

### 3. With Weight Captured

```
[Delivery Reference Card] ← Shows target: 25.5 kg
▼
[Weight from IoT Scale: 24.8 kg] ← Actual captured weight
▼
[Variance Display] ← Shows difference and status
```

## Card Sections Breakdown

### Header Section:

- **Icon**: Scale icon in circular white background
- **Title**: "📦 Delivery Reference" (semibold, blue-900)
- **Subtitle**: "Target specifications for weighing process" (blue-600)

### Content Grid:

#### Left: Item Details

- **Section Title**: "ITEM DETAILS" (uppercase, tracking-wide)
- **Product**: Full product name
- **Target Weight**: Large, bold, blue text
- **Supplier**: If available

#### Right: Delivery Info

- **Section Title**: "DELIVERY INFO" (uppercase, tracking-wide)
- **Delivery ID**: Monospace font with # prefix
- **Status**: Badge with truck emoji
- **Data Source**: Origin of the data

### Guidelines Footer:

- **Background**: Blue-100 with border
- **Icon**: 💡 bulb emoji
- **Content**: Two-line explanation of variance rules

## CSS Classes Reference

```css
/* Main container */
.delivery-card {
  @apply p-4 transition-all duration-200 
         bg-gradient-to-r from-blue-50 to-indigo-50 
         border border-blue-200 rounded-lg shadow-sm;
}

/* Header icon */
.header-icon {
  @apply flex items-center justify-center w-8 h-8 mr-3 
         text-blue-600 bg-white rounded-full shadow-sm;
}

/* Content sections */
.content-section {
  @apply p-3 bg-white rounded-lg shadow-sm;
}

/* Target weight highlight */
.target-weight {
  @apply font-bold text-blue-700 text-lg;
}

/* Guidelines box */
.guidelines {
  @apply flex items-start p-3 mt-4 text-sm text-blue-800 
         bg-blue-100 rounded-lg border border-blue-200;
}
```

## User Journey with Card

1. **Page Load**: Only sample dropdown visible
2. **Sample Selection**: Card slides in smoothly
3. **Information Review**: User sees target weight and context
4. **Weight Capture**: IoT button gets weight, comparison visible
5. **Variance Check**: Color-coded feedback based on difference
6. **Submission**: All data context clear for operator

**Result: Informative, visually appealing reference card that provides essential context for weighing operations! 🎯📊**
