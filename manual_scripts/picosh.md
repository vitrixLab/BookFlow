# Welcome to pico.sh — Account & SSH Key Setup

By creating an account you get access to our pico services (free and paid).
After your account is ready, visit the docs to get started:  
🔗 [https://pico.sh/getting-started](https://pico.sh/getting-started)

---


---

## SSH Public Key Detected
The following public key was automatically read from your system:
```
SHA256:s719xsRsYgN06ZmyqguJyNkdtWlDTCa/xb0rMxB
```

> ℹ️ This key will be associated with your pico.sh account when you **signup** below.

---

## Actions
- **`signup`** – Create a new pico.sh account using the detected SSH key.  
  *(Select this option and press Enter to proceed.)*

---

## Quick Reference
| Item          | Value |
|---------------|-------|
| **Service**   | pico.sh (management TUI) |
| **Key type**  | SSH public key (SHA256 hash shown) |
| **Next step** | Choose `signup` to register |

---

## ✅ SSH Public Key Registered

The following public key is now associated with your pico.sh account.  
It will be used automatically when you connect to any pico service (e.g., `tuns.sh`).

| Field       | Value                                                          |
|-------------|----------------------------------------------------------------|
| **Key Type**  | `ssh-ed25519`                                                  |
| **Key**       | `AAAAC3NzaC1lZ...oX0NE2BqJaBuC7v`                             |
| **SHA256**    | `SHA256:s719xsRsYgN062zmyqguJyNkdtWlDTCa/xbOrMxB4`            |
| **Created**   | 2026-05-03                                                     |

---

## 🚀 Start the PostgreSQL Tunnel

With the key in place, your tunnel will work immediately.

**Basic command (random port):**
```bash
ssh -R 5432:localhost:5432 vitrixlab@tuns.sh

