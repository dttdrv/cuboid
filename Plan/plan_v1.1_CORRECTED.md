# Project Cuboid: Technical Specification v1.1 (CORRECTED)
## Sovereign Research Infrastructure with Mistral AI Partnership

**Classification**: Technical Architecture Document  
**Status**: CORRECTED - Mistral API Primary  
**Date**: 2026-01-28  
**Critical Note**: This document corrects v1.0's error regarding AI primary method.  
**Architecture Principle**: Mistral API is the PRIMARY AI interface; local models are OPTIONAL FALLBACK.

---

## 1. Executive Summary (CORRECTED)

**PRIMARY ARCHITECTURE**: Cuboid integrates **Mistral AI API** (Large 3/Small 3) as the core artificial intelligence engine, protected by Mistral's Zero Data Retention (ZDR) contractual guarantees and EU jurisdiction.

**SECONDARY/FALLBACK**: Local models (Ollama/Ministral) offered as user-enabled alternative for air-gapped scenarios, NOT the default.

**THE MODEL**:
- **Cuboid Realm**: End-to-end encrypted storage, collaboration, version history (zero-knowledge)
- **Mistral Realm**: Primary AI processing via API under ZDR (contractual guarantee)
- **User Control**: Explicit per-request consent to send data to Mistral; ability to disable and use local fallback

**THE PITCH**: "Prism functionality with Mistral's European privacy standards—your research never trains OpenAI's models."

---

## 2. The Two Realms (Corrected Trust Boundaries)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CUBOID REALM                                     │
│                    (Cryptographic Zero-Knowledge)                            │
│                                                                               │
│  • Document Storage: E2E AES-256-GCM encrypted                                │
│  • Collaboration: Yjs encrypted CRDTs                                        │
│  • Version History: Encrypted, client-side keys only                         │
│  • Compilation: WASM TeX (client-side primary)                               │
│                                                                               │
│  GUARANTEE: Cuboid operators cannot read your documents even if compelled.   │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (Explicit user consent per AI request)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              MISTRAL REALM                                    │
│                      (Primary AI - API with ZDR)                             │
│                                                                               │
│  • AI Processing: Mistral Large 3 (256K context)                             │
│  • Policy: Zero Data Retention (contractual)                                 │
│  • Jurisdiction: EU (France) - GDPR Article 44-49                            │
│  • Guarantee: No training on user content, no retention post-processing      │
│                                                                               │
│  FALLBACK: Local Ollama (user-enabled, air-gapped mode)                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. AI Architecture: Mistral API Primary

### 3.1 Primary Mode: Mistral API (Default)

**Integration**: Direct API integration with Mistral's "La Plateforme"
- **Models**: Mistral Large 3 (256K context), Mistral Small 3 (fast), Pixtral (vision optional)
- **Endpoint**: `api.mistral.ai` (EU-only, no US fallback)
- **Authentication**: Short-lived tokens (1-hour expiry) via Cuboid backend
- **Policy**: Zero Data Retention enabled for Cuboid tenant

**User Experience**:
```
User selects text → Presses Cmd+K → AI assists immediately via Mistral API
                   ↓
            [Transparent processing]
                   ↓
            Response injected into document
```

**Privacy Control**:
- Per-request confirmation (can be disabled in settings for trusted users)
- Content minimization: Only selected text sent, not full document
- Metadata stripping: Author names/institutions redacted client-side before transmission

### 3.2 Fallback Mode: Local Models (User-Enabled)

**Activation**: User toggles "Sovereign Mode" in settings
- **Engine**: Ollama integration
- **Models**: Ministral 8B/7B (4-bit quantized)
- **Performance**: Slower, less capable, but zero network transmission
- **Use case**: Classified research, air-gapped networks, users who reject cloud trust

**NOT the default. NOT the primary pitch. An escape valve for edge cases.**

---

## 4. Data Flow: Mistral API Path (Primary)

### 4.1 Standard AI Request Flow

```
1. USER ACTION
   User selects paragraph in editor → Triggers AI assist (Cmd+K)

2. CONSENT CHECK (Optional based on settings)
   If explicit_consent enabled:
     Show: "Send 847 tokens to Mistral AI (EU/ZDR)?"
     User clicks "Assist Me"

3. CONTENT PREPARATION (Client-side)
   • Extract selected text from ProseMirror AST
   • Sanitize: Remove \cite{}, author names, institution macros
   • Wrap in prompt template (LaTeX-specific context)

4. ENCRYPTION IN TRANSIT
   • TLS 1.3 with ESNI (Encrypted SNI)
   • Request routing: EU datacenter only (api.mistral.ai)

5. MISTRAL PROCESSING
   • Request received by Mistral inference worker
   • Processed in ephemeral container
   • Zero Data Retention enforced (no logging to persistent storage)
   • Response generated

6. RESPONSE HANDLING
   • TLS-encrypted response to client
   • Client decrypts and injects into ProseMirror document
   • No local storage of query/response pair (unless user saves)

7. DOCUMENT STORAGE
   • Final document encrypted client-side (AES-256-GCM)
   • Ciphertext sent to Cuboid server for storage
   • Server holds only encrypted blob (zero knowledge)
```

### 4.2 Privacy Guarantees by Realm

| Layer | Protection | Verification |
|-------|-----------|--------------|
| **In Transit** | TLS 1.3 | Certificate pinning; EU endpoint enforcement |
| **At Mistral** | ZDR Contract | Mistral SOC 2; transparency reports |
| **At Cuboid** | E2E Encryption | Client-side decryption; open-source audit |
| **In Browser** | Memory encryption | WebCrypto non-exportable keys |

---

## 5. Technical Stack (Mistral-Centric)

### 5.1 Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Editor** | ProseMirror (Overleaf CE fork) | Structured LaTeX editing; collaborative |
| **AI Engine** | **Mistral API (Large 3)** | Primary intelligence; 256K context |
| **AI Fallback** | Ollama (Ministral 8B) | Air-gap mode; user-activated |
| **Sync** | Yjs + encrypted CRDTs | Zero-knowledge collaboration |
| **Storage** | PostgreSQL (encrypted blobs) | Zero-knowledge document store |
| **Compile** | WASM TeX (texlive.js) | Client-side compilation |
| **Auth** | Ory Kratos | User management; MFA |

### 5.2 Mistral Integration Details

**API Client Architecture**:
```typescript
// Cuboid Mistral Client - Primary Interface
class MistralEngine {
  private readonly API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
  private readonly ZDR_HEADER = 'x-mistral-zdr-enabled: true';

  async assist(context: LaTeXContext, selection: string): Promise<AIResult> {
    // 1. Prepare prompt with LaTeX context
    const prompt = this.buildLaTeXPrompt(context, selection);

    // 2. Sanitize PII before sending
    const sanitized = this.sanitizeForPrivacy(prompt);

    // 3. Call Mistral with ZDR enforcement
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getEphemeralToken()}`,
        'Content-Type': 'application/json',
        'X-Mistral-ZDR': 'true', // Enforce ZDR
        'X-Region-Lock': 'eu-west' // EU only
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{role: 'user', content: sanitized}],
        max_tokens: 2000
      })
    });

    // 4. Return parsed result
    return this.parseLatexResponse(response);
  }

  private sanitizeForPrivacy(text: string): string {
    // Remove citations that could identify paper
    return text
      .replace(/\cite{[^}]+}/g, '[Citation]')
      .replace(/\author{[^}]+}/g, '[Author]')
      .replace(/\institution{[^}]+}/g, '[Institution]');
  }
}
```

**Configuration**:
- **Default model**: Mistral Large 3 (256K context for long documents)
- **Fast model**: Mistral Small 3 (for autocomplete/quick fixes)
- **Vision model**: Pixtral (for whiteboard-to-LaTeX feature, if enabled)
- **ZDR Enforcement**: Hardcoded headers; non-ZDR requests rejected client-side

---

## 6. Privacy Model: Explicit & Transparent

### 6.1 The Mistral Promise (Contractual)

**What Mistral Guarantees** (ZDR Policy):
1. **No Storage**: Prompts/responses not written to disk
2. **No Training**: User content excluded from model improvement
3. **Ephemeral Processing**: Memory wiped after request completion
4. **EU Jurisdiction**: Data never leaves EU (GDPR)
5. **Audit Rights**: Cuboid can audit compliance quarterly

**What This Protects Against**:
- ✅ Derivative works claims (cannot train on what they don't store)
- ✅ Data breaches (no persistent data to breach)
- ✅ Subpoena (nothing to hand over)

### 6.2 The Cuboid Guarantee (Cryptographic)

**What Cuboid Guarantees**:
1. **Document Encryption**: AES-256-GCM; keys never leave your device
2. **Zero-Knowledge**: We store ciphertext only; cannot decrypt
3. **Collaboration Privacy**: Encrypted sync; server sees only metadata (user count, timestamps)
4. **Open Source**: Client auditable; reproducible builds

**What This Protects Against**:
- ✅ Cuboid compromise (ciphertext useless without keys)
- ✅ Employee snooping (mathematically impossible)
- ✅ Subpoena (we have only encrypted blobs)

### 6.3 User Control Interface

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️  AI PRIVACY SETTINGS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRIMARY METHOD: Mistral AI (Recommended)                   │
│  ├─ Model: Mistral Large 3 (256K context)                   │
│  ├─ Location: EU (France)                                   │
│  ├─ Retention: Zero Data Retention ✓                       │
│  ├─ Training: Excluded from model improvement ✓            │
│  └─ Status: ● Active                                        │
│                                                              │
│  [ ] Require explicit confirmation for each AI request     │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  FALLBACK METHOD: Local AI (Sovereign Mode)                 │
│  ├─ Model: Ministral 8B (4-bit quantized)                   │
│  ├─ Performance: ~10x slower than cloud                     │
│  ├─ Privacy: Absolute (no network transmission)             │
│  └─ Status: ○ Disabled (Enable for air-gapped use)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Partnership Strategy: Mistral Integration

### 7.1 The Value Exchange

**Cuboid Provides**:
- Research-focused UI/UX (LaTeX-native editor)
- End-to-end encrypted storage (differentiator vs Overleaf)
- Distribution to academic market (Bulgaria/EU expansion)
- Showcase for Mistral capabilities (256K context, ZDR)

**Mistral Provides**:
- AI inference with ZDR guarantee (competitive advantage vs OpenAI)
- EU jurisdiction (GDPR compliance for sensitive research)
- Technical support for integration
- Co-marketing: "Powered by Mistral AI"

### 7.2 Technical Partnership Requirements

From Mistral:
1. **ZDR Tenant**: Dedicated Cuboid tenant with contractual ZDR
2. **EU Endpoint Guarantee**: Hardcoded EU-only routing (no US fallback)
3. **Token Management**: Short-lived session tokens (not persistent API keys)
4. **Transparency**: Quarterly audit reports of ZDR compliance
5. **Rate Limits**: Suitable for real-time collaborative editing (high RPM)

From Cuboid:
1. **Content Minimization**: Only send necessary text (not full documents)
2. **User Consent**: Clear opt-in per request (unless user disables)
3. **Local Fallback**: Offer Ollama integration for users who reject cloud
4. **Attribution**: "Powered by Mistral AI" branding
5. **Usage Reporting**: Aggregate stats (no content) for capacity planning

### 7.3 Legal Framework

**Data Processing Agreement (DPA)**:
- Mistral as Processor (GDPR Article 28)
- Cuboid as Controller (for user data management)
- Subprocessor list: None (Mistral processes directly)
- Data residency: EU only
- Breach notification: 24 hours

**Zero Data Retention Addendum**:
- Definition: No persistent storage of prompts/outputs
- Technical verification: Quarterly penetration testing
- Financial penalties: For breaches of ZDR commitment
- Audit rights: Cuboid can inspect Mistral infrastructure annually

---

## 8. Differentiation from OpenAI Prism

| Feature | OpenAI Prism | Cuboid + Mistral |
|---------|-------------|------------------|
| **AI Ownership** | OpenAI claims derivative rights[^51^] | Mistral waives all rights; ZDR guarantee |
| **Data Retention** | Logs retained "for period"[^41^] | Zero Data Retention (contractual + technical) |
| **Jurisdiction** | US (CLOUD Act exposure) | EU (GDPR) |
| **Storage Privacy** | Centralized, readable by OpenAI | E2E encrypted; zero-knowledge |
| **Collaboration** | Cloud-only | E2E encrypted peer-to-peer |
| **User Control** | Always-on AI | Per-request consent + local fallback |
| **Context Window** | ~128K | 256K (Mistral Large 3)[^54^] |
| **Open Source** | Proprietary | Core open source (AGPL) |

**Key Message**: "Prism functionality with European privacy standards—your research never trains American AI models."

---

## 9. Implementation Roadmap (Mistral-First)

### Phase 1: Mistral Integration MVP (Weeks 1-6)
**Goal**: Working editor with Mistral API as primary AI
- [ ] Fork Overleaf CE editor (ProseMirror-based)
- [ ] Implement E2E encryption for document storage
- [ ] **Mistral API integration (Large 3)**
- [ ] ZDR header enforcement
- [ ] Explicit consent UI
- [ ] WASM TeX compilation

**Success Criteria**: User can write LaTeX, get AI assistance from Mistral with ZDR, document encrypted.

### Phase 2: Collaboration (Weeks 7-12)
**Goal**: Encrypted real-time collaboration
- [ ] Yjs encrypted CRDT integration
- [ ] WebRTC P2P sync
- [ ] Presence/awareness (encrypted)
- [ ] Conflict resolution for LaTeX structures

**Success Criteria**: Three users edit collaboratively; server compromise reveals nothing.

### Phase 3: Local Fallback & Polish (Weeks 13-18)
**Goal**: Air-gapped mode as option, not default
- [ ] Ollama integration (optional fallback)
- [ ] Ministral 8B download/setup flow
- [ ] Performance optimization for WASM compile
- [ ] Mobile/tablet responsiveness

**Success Criteria**: User can enable "Sovereign Mode" to use local AI; default remains Mistral API.

### Phase 4: Enterprise & Audit (Weeks 19-24)
**Goal**: Institutional deployment, SOC 2
- [ ] SAML/SSO integration
- [ ] SOC 2 Type II audit
- [ ] Air-gapped institutional package
- [ ] Formal verification of crypto primitives

---

## 10. Risk Assessment (Mistral Partnership)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Mistral ZDR breach** | Low | Critical | Quarterly audits; contractual penalties; immediate failover to local |
| **Mistral acquisition by US company** | Low | High | Contractual continuity clause; automatic local mode activation; data export |
| **API rate limiting** | Medium | Medium | Caching layer; request batching; local model fallback during outages |
| **EU network partition** | Low | Medium | Multi-region EU deployment (FR/DE/NL); offline mode with local sync |
| **Cryptographic bug** | Low | Critical | External audit; formal verification; bug bounty program |
| **Key loss by user** | Medium | Critical | Encrypted backup to user-controlled cloud; recovery codes |

---

## 11. Conclusion

**Cuboid** is a **Mistral AI-powered** research writing platform with cryptographic privacy guarantees for document storage and collaboration, transparent trust boundaries for AI processing, and explicit user control.

**The Promise**: Your documents are mathematically protected from Cuboid. Your AI queries are contractually protected from retention by Mistral. Your control is absolute.

**The Differentiation**: Unlike OpenAI Prism, which claims derivative rights over your proofs through broad ToS, Cuboid with Mistral offers enumerated, contractual, auditable privacy protections in European jurisdiction.

**The Method**: Mistral Large 3 via API (primary) with Zero Data Retention; local models (optional) for air-gapped scenarios.

---

**CORRECTION NOTE**: This document corrects v1.0's error regarding primary AI method. Mistral API is the primary interface; local models are secondary fallback only.

**Version**: 1.1 (Corrected)  
**Distribution**: Mistral Partnership Team, Development, Legal  
**Next Action**: Submit to Mistral for technical partnership review
