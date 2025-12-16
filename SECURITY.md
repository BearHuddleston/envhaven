# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in EnvHaven, please report it responsibly.

### How to Report

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns to: **security@envhaven.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity, typically 30-90 days

### Scope

This policy applies to:
- The EnvHaven Docker image (`ghcr.io/envhaven/envhaven`)
- The Haven CLI
- The VS Code extension
- This repository's code

### Out of Scope

- Vulnerabilities in upstream dependencies (report to the respective projects)
- Self-hosted instances with custom modifications
- Social engineering attacks

## Security Best Practices

When using EnvHaven:

1. **Use strong passwords** for web UI and SSH access
2. **Don't expose ports** (8443, 22) to the public internet without protection
3. **Keep your image updated** to get security patches
4. **Use SSH keys** instead of passwords when possible
5. **Review API keys** you add to the environment

## Acknowledgments

We appreciate security researchers who help keep EnvHaven safe. Contributors who report valid vulnerabilities will be acknowledged here (with permission).
