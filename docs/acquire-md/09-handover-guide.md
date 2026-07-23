# KEEVAN STORE
## Handover Guide
### Post Acquisition Transition and Knowledge Transfer

| Field | Detail |
|---|---|
| Document | 09 of 10: Handover Guide |
| Platform | keevanstore.in |
| Transfer Period | Two weeks post acquisition |
| Date | July 9, 2026 |

---

### Handover Process Overview

The handover process is designed to ensure a smooth transition of the Keevan Store platform to the acquiring company. The process spans two weeks and covers all aspects of platform ownership, operation, and future development.

The handover follows a structured approach:
1. **Week 1**: Focus on access transfer, infrastructure setup, and hands on configuration
2. **Week 2**: Focus on knowledge transfer, architecture deep dives, and strategic planning

---

### Week 1: Access and Setup

#### Day 1: Source Code Transfer

| Activity | Details |
|---|---|
| GitHub Repository | Transfer repository ownership to the acquirer's GitHub organization |
| Branch Access | All branches and full version history included |
| Local Setup | Walk through cloning, installing dependencies, and running the development server |
| Review | Review project structure, key directories, and coding conventions |

**Deliverables:**
- Acquirer has full read/write access to the GitHub repository
- Local development environment is operational
- Team understands the codebase structure

#### Day 2: Infrastructure Account Transfer

| Activity | Details |
|---|---|
| Vercel Project | Transfer project ownership to acquirer's Vercel team |
| Environment Variables | Transfer all environment variable values |
| Deployment | Run a test deployment to verify CI/CD pipeline |
| Domains | Verify keevanstore.in is correctly configured |

**Deliverables:**
- Acquirer has full access to Vercel project
- Successful test deployment completed
- Environment variables documented and transferred

#### Day 3: Database and Services Transfer

| Activity | Details |
|---|---|
| Supabase Project | Transfer project ownership to acquirer |
| Database Access | Provide database connection strings and credentials |
| Storage Access | Review storage buckets and access policies |
| Resend Access | Transfer email API access |
| Sentry Access | Transfer error monitoring project |

**Deliverables:**
- Acquirer has full access to all service accounts
- Database connection verified
- Email sending verified
- Error monitoring operational

#### Day 4: Payment Integration Transfer

| Activity | Details |
|---|---|
| Pesapal Account | Transfer merchant account or provide API credentials |
| IPN Webhook | Verify IPN endpoint is correctly configured |
| Transaction History | Export and transfer transaction records |
| Test Payment | Run a test payment through the checkout flow |

**Deliverables:**
- Acquirer has Pesapal API credentials
- IPN webhook verified working
- Test payment completed successfully
- Transaction history exported

#### Day 5: Domain and Brand Transfer

| Activity | Details |
|---|---|
| Domain Transfer | Initiate keevanstore.in domain transfer to acquirer's registrar |
| DNS Configuration | Document all DNS records and configurations |
| Brand Assets | Transfer all logos, SVGs, and brand identity files |
| SSL Certificates | Verify SSL configuration is active and valid |

**Deliverables:**
- Domain transfer initiated
- DNS configuration documented
- Brand assets delivered

---

### Week 2: Knowledge Transfer

#### Day 6: Architecture Overview

| Topic | Details |
|---|---|
| Frontend Architecture | Next.js 15 App Router structure, server components, client components |
| Backend Architecture | API route organization, middleware, server actions |
| Data Flow | How data moves from database to API to frontend |
| State Management | How user sessions, product data, and order state are managed |
| Key Design Decisions | Why specific architectural choices were made |

#### Day 7: Payment Integration Deep Dive

| Topic | Details |
|---|---|
| Pesapal API Flow | Complete payment lifecycle from order creation to IPN callback |
| IPN Handling | How IPN webhooks are processed, verified, and stored |
| Error Recovery | How failed payments, timeouts, and network issues are handled |
| Timeout Configuration | maxDuration settings and why 300 seconds is configured |
| Currency Handling | How multi currency support (UGX, KES, etc.) is implemented |
| Testing Payments | How to test payments in development and staging environments |

#### Day 8: Testing and Deployment

| Topic | Details |
|---|---|
| Test Suite Overview | Structure of the 609 tests across 27 suites |
| Running Tests | How to run tests, interpret results, and add new tests |
| CI/CD Pipeline | How GitHub Actions and Vercel work together |
| Deployment Process | How to deploy, rollback, and manage environments |
| Writing Tests | Best practices for writing tests for new features |
| Test Coverage | Current coverage areas and gaps to address |

#### Day 9: Security Architecture

| Topic | Details |
|---|---|
| Row Level Security | How RLS policies work on each table and how to modify them |
| CSRF Protection | How Origin and Referer validation is implemented |
| Rate Limiting | How database backed rate limiting works and how to configure thresholds |
| File Validation | How file uploads are validated on client and server |
| Role Based Access | How creator, buyer, and admin roles are enforced |
| Security Checklist | What to review when adding new features |

#### Day 10: Future Development Roadmap

| Topic | Details |
|---|---|
| Immediate Priorities | What should be addressed first (growth phase initiatives) |
| Known Improvements | Existing enhancement opportunities and technical debt |
| Market Opportunities | Which markets to prioritize (Kenya, Tanzania, etc.) |
| Scaling Considerations | How to handle increased traffic and transaction volume |
| Feature Requests | Existing feature requests and user feedback |
| Growth Strategy | Recommended approach for creator and buyer acquisition |

---

### Handover Checklist

| Item | Status |
|---|---|
| GitHub repository transferred | Pending |
| Vercel project transferred | Pending |
| Supabase project transferred | Pending |
| Resend API access transferred | Pending |
| Sentry project transferred | Pending |
| Pesapal credentials transferred | Pending |
| Domain transfer initiated | Pending |
| Environment variables documented | Pending |
| Architecture overview completed | Pending |
| Payment deep dive completed | Pending |
| Testing overview completed | Pending |
| Security review completed | Pending |
| Roadmap discussion completed | Pending |

---

### Post Handover Support

After the two week handover period, the original developer will be available for:

- Email support for critical questions (limited)
- Paid consulting for complex issues or custom development
- Referral to trusted developers for ongoing maintenance

---

### Contact

| | |
|---|---|
| Platform | Keevan Store |
| Website | https://keevanstore.in |
| Email | nkevinmegan@gmail.com |
| Location | Uganda, East Africa |

---

CONFIDENTIAL | Keevan Store Acquisition Documentation
