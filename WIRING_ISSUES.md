# Wiring Issues Analysis Report

This document lists all wiring issues found in the codebase that could cause runtime errors or unexpected behavior.

## Critical Issues

### 1. Component Import Path Mismatch ❌
**Location**: Multiple files in `frontend/app/`
**Issue**: Components are located in `frontend/src/components/` but imports use `../components/` which resolves to `frontend/app/components/` (doesn't exist)

**Affected Files**:
- `frontend/app/dashboard/page.tsx` - Line 4-5
- `frontend/app/navigate/NavigateClient.tsx` - Line 4
- `frontend/app/editor/page.tsx` - Line 4
- `frontend/app/upload/page.tsx` - Line 4
- `frontend/app/qr/page.tsx` - Line 4

**Fix**: Change imports from:
```typescript
import Layout from "../components/Layout";
```
To:
```typescript
import Layout from "../../src/components/Layout";
```

---

### 2. Authentication State Key Mismatch ❌
**Location**: `frontend/app/login/page.tsx` vs multiple frontend pages
**Issue**: Login page sets `localStorage.setItem("auth", "true")` but all other components check for `localStorage.getItem("isAuthenticated")`

**Affected Files**:
- `frontend/app/login/page.tsx` - Line 47 (sets "auth")
- `frontend/app/dashboard/page.tsx` - Line 27 (checks "isAuthenticated")
- `frontend/app/navigate/NavigateClient.tsx` - Line 29
- `frontend/app/editor/page.tsx` - Line 57
- `frontend/app/upload/page.tsx` - Line 32
- `frontend/app/qr/page.tsx` - Line 30
- `frontend/src/components/Layout.tsx` - Line 15

**Fix**: Either:
- Change login to use `localStorage.setItem("isAuthenticated", "true")`
- OR change all checks to use `localStorage.getItem("auth")`

---

### 3. Missing Authentication in Navigation API Call ❌
**Location**: `frontend/app/api/navigation.ts`
**Issue**: The `getShortestPath` function doesn't send authentication credentials, but the backend endpoint `/api/navigation/shortest-path` is protected by `protectRoute` which requires authentication.

**Current Code** (Line 26-32):
```typescript
const res = await fetch(
  `${API_BASE}/api/navigation/shortest-path`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }
);
```

**Fix**: Add credentials to send cookies:
```typescript
const res = await fetch(
  `${API_BASE}/api/navigation/shortest-path`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ⚠️ REQUIRED to send auth cookies
    body: JSON.stringify(payload),
  }
);
```

---

### 4. Mobile App API Parameter Mismatch ❌
**Location**: `mobile/src/lib/api/navigation.js` vs `backend/src/app/api/navigation/shortest-path/route.ts`
**Issue**: 
- Mobile sends `hospitalId` as first parameter but backend expects `floorId`
- Mobile function signature: `fetchPath(hospitalId, startNodeId, endNodeId, userEmail, token)`
- Backend expects: `{ floorId, startNodeId, endNodeId, hospitalId }`
- Parameter order and names don't match

**Current Mobile Code** (Line 17-39):
```javascript
export async function fetchPath(
  hospitalId: string,  // ❌ Backend expects floorId
  startNodeId: string,
  endNodeId: string,
  userEmail?: string,
  token?: string
) {
  const body = {
    hospitalId,  // ❌ Wrong - should be floorId
    startNodeId,
    endNodeId,
  };
```

**Backend Expects** (Line 8):
```typescript
const { floorId, startNodeId, endNodeId, hospitalId } = await req.json();
```

**Fix**: Update mobile function to:
```javascript
export async function fetchPath(
  floorId: string,  // ✅ Changed from hospitalId
  startNodeId: string,
  endNodeId: string,
  hospitalId?: string,  // ✅ Optional, can be derived from floor
  userEmail?: string,
  token?: string
) {
  const body = {
    floorId,  // ✅ Changed
    startNodeId,
    endNodeId,
    ...(hospitalId ? { hospitalId } : {}),  // ✅ Optional
  };
```

---

### 5. Missing Region in Login Response ❌
**Location**: `backend/src/app/api/auth/login/route.ts`
**Issue**: Frontend expects `data.region` in login response (Line 53 in `frontend/app/login/page.tsx`) but backend doesn't return it.

**Current Backend Code** (Line 28-31):
```typescript
const response = NextResponse.json({
  message: "Login successful",
  subscriptionStatus: user.planStatus,
  // ❌ Missing: region
});
```

**Frontend Expects** (Line 53):
```typescript
localStorage.setItem("region", data.region || "IN");
```

**Fix**: Add region to response (fetch from user or hospital data).

---

### 6. Empty DELETE Handler in API Proxy ❌
**Location**: `frontend/app/api/[...path]/route.ts`
**Issue**: DELETE handler is empty (Line 17-19), will throw error if called.

**Current Code**:
```typescript
export async function DELETE(req: NextRequest, { params }: any) {
  // ❌ Empty - should call proxy()
}
```

**Fix**: Call proxy function:
```typescript
export async function DELETE(req: NextRequest, { params }: any) {
  return proxy(req, params);
}
```

---

## Medium Priority Issues

### 7. Missing Error Response in Mobile Navigation Screen ⚠️
**Location**: `mobile/src/screens/NavigationScreen.js`
**Issue**: `fetchPath` is called with hardcoded `'destinationNode'` (Line 19) which will always fail. No way to select destination.

**Current Code** (Line 19):
```javascript
fetchPath(hospitalId, startPosition.nodeId, 'destinationNode', userEmail)
  // ❌ 'destinationNode' is hardcoded string, not actual destination
```

**Fix**: Pass actual destination node ID from route params or user selection.

---

### 8. Environment Variable Inconsistency ⚠️
**Location**: Frontend environment variable usage
**Issue**: 
- `frontend/app/api/navigation.ts` uses `NEXT_PUBLIC_BACKEND_URL`
- `frontend/app/api/[...path]/route.ts` uses `BACKEND_URL` (not accessible in client components)

**Recommendation**: Ensure consistent naming. `NEXT_PUBLIC_*` variables are available to client-side code, while `BACKEND_URL` is only server-side.

---

## Summary

| Issue | Severity | Files Affected | Impact |
|-------|----------|----------------|--------|
| Component Import Path | Critical | 5 files | App won't compile/run |
| Auth State Key Mismatch | Critical | 7 files | Auth checks always fail |
| Missing Auth in Navigation API | Critical | 1 file | API calls will be rejected |
| Mobile API Parameter Mismatch | Critical | 1 file | Mobile navigation won't work |
| Missing Region in Response | Medium | 1 file | Region defaults to "IN" |
| Empty DELETE Handler | Medium | 1 file | DELETE requests will error |
| Hardcoded Destination | Medium | 1 file | Navigation always fails |
| Env Var Inconsistency | Low | 2 files | Potential confusion |

## Recommended Fix Priority

1. **Fix Component Import Paths** (Blocks compilation)
2. **Fix Authentication State Key** (Blocks all auth checks)
3. **Add Credentials to Navigation API** (Blocks navigation feature)
4. **Fix Mobile API Parameters** (Blocks mobile app)
5. **Fix Other Issues** (Improves robustness)

