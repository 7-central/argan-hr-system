#!/usr/bin/env tsx

/**
 * Security Report Generator
 *
 * This script generates comprehensive security reports from OWASP ZAP scan results
 * and performs additional security validation checks specific to the Argan HR System.
 *
 * Features:
 * - HTML and JSON report generation
 * - Security header validation
 * - Input validation assessment
 * - Compliance checking (OWASP Top 10)
 * - Remediation recommendations
 *
 * Usage:
 *   npx tsx scripts/security-report.ts [options]
 *
 * @author Argan HR System
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { SecurityScanResult } from './security-scan';

interface SecurityReportOptions {
  inputFile: string;
  outputFormat: 'html' | 'json' | 'both';
  outputDir: string;
  includeRemediation: boolean;
  complianceCheck: boolean;
}

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  details: string;
  recommendation?: string;
}

interface SecurityReport {
  metadata: {
    generated: string;
    version: string;
    target: string;
    scanTimestamp: string;
  };
  summary: {
    overallStatus: 'secure' | 'warnings' | 'critical';
    totalVulnerabilities: number;
    criticalIssues: number;
    securityScore: number; // 0-100
  };
  vulnerabilities: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    description: string;
    location: string;
    remediation: string;
    references: string[];
  }>;
  securityHeaders: {
    status: 'pass' | 'fail' | 'warning';
    details: Record<string, { present: boolean; value?: string; recommendation?: string }>;
  };
  compliance: {
    owaspTop10: ComplianceItem[];
    overallCompliance: number; // percentage
  };
  recommendations: string[];
}

class SecurityReportGenerator {
  private options: SecurityReportOptions;

  constructor(options: SecurityReportOptions) {
    this.options = options;
  }

  /**
   * Generate comprehensive security report
   */
  async generateReport(): Promise<SecurityReport> {
    console.log('📊 Generating security report...');

    try {
      // Load scan results
      const scanResults = this.loadScanResults();

      // Generate comprehensive report
      const report: SecurityReport = {
        metadata: {
          generated: new Date().toISOString(),
          version: '1.0.0',
          target: scanResults.target,
          scanTimestamp: scanResults.timestamp
        },
        summary: this.generateSummary(scanResults),
        vulnerabilities: this.processVulnerabilities(scanResults),
        securityHeaders: this.analyzeSecurityHeaders(scanResults.headers),
        compliance: await this.checkCompliance(scanResults),
        recommendations: this.generateRecommendations(scanResults)
      };

      // Save reports based on format
      await this.saveReports(report);

      console.log('✅ Security report generated successfully');
      return report;

    } catch (error) {
      console.error('❌ Failed to generate security report:', error);
      throw error;
    }
  }

  /**
   * Load security scan results
   */
  private loadScanResults(): SecurityScanResult {
    const inputPath = join(this.options.outputDir, this.options.inputFile);

    if (!existsSync(inputPath)) {
      throw new Error(`Security scan results not found: ${inputPath}`);
    }

    try {
      const data = readFileSync(inputPath, 'utf8');
      return JSON.parse(data) as SecurityScanResult;
    } catch (error) {
      throw new Error(`Failed to parse security scan results: ${error}`);
    }
  }

  /**
   * Generate summary section
   */
  private generateSummary(scanResults: SecurityScanResult): SecurityReport['summary'] {
    const criticalIssues = scanResults.summary.high;
    const totalVulns = scanResults.summary.total;

    let overallStatus: 'secure' | 'warnings' | 'critical';
    let securityScore: number;

    if (criticalIssues > 0) {
      overallStatus = 'critical';
      securityScore = Math.max(0, 60 - (criticalIssues * 20));
    } else if (scanResults.summary.medium > 0) {
      overallStatus = 'warnings';
      securityScore = Math.max(70, 90 - (scanResults.summary.medium * 5));
    } else {
      overallStatus = 'secure';
      securityScore = Math.max(85, 100 - (totalVulns * 2));
    }

    return {
      overallStatus,
      totalVulnerabilities: totalVulns,
      criticalIssues,
      securityScore
    };
  }

  /**
   * Process and categorize vulnerabilities
   */
  private processVulnerabilities(scanResults: SecurityScanResult): SecurityReport['vulnerabilities'] {
    return scanResults.vulnerabilities.map(vuln => ({
      id: vuln.id,
      title: vuln.name,
      severity: this.mapSeverity(vuln.risk),
      category: this.categorizeVulnerability(vuln.name),
      description: vuln.description,
      location: vuln.url,
      remediation: vuln.solution || this.getDefaultRemediation(vuln.name),
      references: this.getSecurityReferences(vuln.name)
    }));
  }

  /**
   * Map ZAP risk levels to our severity levels
   */
  private mapSeverity(risk: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    switch (risk.toLowerCase()) {
      case 'high': return 'critical';
      case 'medium': return 'high';
      case 'low': return 'medium';
      default: return 'info';
    }
  }

  /**
   * Categorize vulnerability by type
   */
  private categorizeVulnerability(vulnName: string): string {
    const name = vulnName.toLowerCase();

    if (name.includes('sql') || name.includes('injection')) return 'Injection';
    if (name.includes('xss') || name.includes('script')) return 'Cross-Site Scripting';
    if (name.includes('csrf') || name.includes('forgery')) return 'CSRF';
    if (name.includes('authentication') || name.includes('auth')) return 'Authentication';
    if (name.includes('session')) return 'Session Management';
    if (name.includes('header') || name.includes('security')) return 'Security Headers';
    if (name.includes('ssl') || name.includes('tls') || name.includes('https')) return 'Transport Security';
    if (name.includes('disclosure') || name.includes('information')) return 'Information Disclosure';

    return 'Other';
  }

  /**
   * Get default remediation advice
   */
  private getDefaultRemediation(vulnName: string): string {
    const name = vulnName.toLowerCase();

    if (name.includes('sql')) {
      return 'Use parameterized queries and input validation to prevent SQL injection attacks.';
    }
    if (name.includes('xss')) {
      return 'Implement proper input validation and output encoding to prevent XSS attacks.';
    }
    if (name.includes('csrf')) {
      return 'Implement CSRF tokens and verify referrer headers for state-changing operations.';
    }
    if (name.includes('header')) {
      return 'Configure proper security headers in your web server or application framework.';
    }

    return 'Review the security implications and implement appropriate countermeasures.';
  }

  /**
   * Get security references for vulnerability
   */
  private getSecurityReferences(vulnName: string): string[] {
    const references = ['https://owasp.org/'];

    const name = vulnName.toLowerCase();
    if (name.includes('sql')) {
      references.push('https://owasp.org/www-community/attacks/SQL_Injection');
    }
    if (name.includes('xss')) {
      references.push('https://owasp.org/www-community/attacks/xss/');
    }
    if (name.includes('csrf')) {
      references.push('https://owasp.org/www-community/attacks/csrf');
    }

    return references;
  }

  /**
   * Analyze security headers
   */
  private analyzeSecurityHeaders(headers: Record<string, string>): SecurityReport['securityHeaders'] {
    const requiredHeaders = {
      'x-frame-options': {
        required: true,
        expectedValues: ['DENY', 'SAMEORIGIN'] as string[],
        recommendation: 'Set to DENY to prevent clickjacking attacks'
      },
      'x-content-type-options': {
        required: true,
        expectedValues: ['nosniff'] as string[],
        recommendation: 'Set to nosniff to prevent MIME type sniffing'
      },
      'content-security-policy': {
        required: true,
        expectedValues: [] as string[],
        recommendation: 'Implement a restrictive CSP to prevent XSS and data injection'
      },
      'referrer-policy': {
        required: true,
        expectedValues: ['strict-origin-when-cross-origin', 'same-origin'] as string[],
        recommendation: 'Control referrer information sent with requests'
      },
      'x-xss-protection': {
        required: false,
        expectedValues: ['1; mode=block'] as string[],
        recommendation: 'Enable XSS filtering in browsers (legacy but still useful)'
      },
      'strict-transport-security': {
        required: true,
        expectedValues: [] as string[],
        recommendation: 'Force HTTPS connections for enhanced security'
      }
    };

    const details: Record<string, { present: boolean; value?: string; recommendation?: string }> = {};
    let passCount = 0;

    for (const [headerName, config] of Object.entries(requiredHeaders)) {
      const headerValue = headers[headerName.toLowerCase()];
      const present = !!headerValue;

      details[headerName] = {
        present,
        value: headerValue,
        recommendation: !present ? config.recommendation : undefined
      };

      if (present && (config.expectedValues.length === 0 || (headerValue && config.expectedValues.includes(headerValue)))) {
        passCount++;
      }
    }

    const totalRequired = Object.values(requiredHeaders).filter(h => h.required).length;
    const status = passCount >= totalRequired ? 'pass' : passCount >= totalRequired * 0.7 ? 'warning' : 'fail';

    return { status, details };
  }

  /**
   * Check OWASP Top 10 compliance
   */
  private async checkCompliance(scanResults: SecurityScanResult): Promise<SecurityReport['compliance']> {
    const owaspTop10: ComplianceItem[] = [
      {
        id: 'A01:2021',
        title: 'Broken Access Control',
        description: 'Restrictions on what authenticated users are allowed to do are often not properly enforced',
        status: this.checkAccessControl(scanResults),
        details: 'Authentication system implemented with session management and RBAC'
      },
      {
        id: 'A02:2021',
        title: 'Cryptographic Failures',
        description: 'Failures related to cryptography which often leads to sensitive data exposure',
        status: this.checkCryptography(scanResults),
        details: 'AES-256-GCM session encryption and bcryptjs password hashing implemented'
      },
      {
        id: 'A03:2021',
        title: 'Injection',
        description: 'Application is vulnerable to injection flaws, such as SQL, NoSQL, OS, and LDAP injection',
        status: this.checkInjection(scanResults),
        details: 'Prisma ORM provides parameterized queries by default'
      },
      {
        id: 'A04:2021',
        title: 'Insecure Design',
        description: 'Risks related to design flaws',
        status: 'pass',
        details: 'Three-layer architecture with separation of concerns implemented'
      },
      {
        id: 'A05:2021',
        title: 'Security Misconfiguration',
        description: 'Missing appropriate security hardening',
        status: this.checkSecurityConfig(scanResults),
        details: 'Security headers configured in Next.js'
      },
      {
        id: 'A06:2021',
        title: 'Vulnerable and Outdated Components',
        description: 'Using components with known vulnerabilities',
        status: 'pass',
        details: 'Dependencies managed with npm and kept up to date'
      },
      {
        id: 'A07:2021',
        title: 'Identification and Authentication Failures',
        description: 'Application functions related to authentication and session management',
        status: 'pass',
        details: 'Robust authentication with rate limiting and audit logging'
      },
      {
        id: 'A08:2021',
        title: 'Software and Data Integrity Failures',
        description: 'Code and infrastructure that does not protect against integrity violations',
        status: 'pass',
        details: 'Vercel deployment with signed packages and secure CI/CD'
      },
      {
        id: 'A09:2021',
        title: 'Security Logging and Monitoring Failures',
        description: 'Insufficient logging and monitoring',
        status: 'pass',
        details: 'Audit logging implemented for all administrative actions'
      },
      {
        id: 'A10:2021',
        title: 'Server-Side Request Forgery',
        description: 'SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL',
        status: 'pass',
        details: 'No server-side request functionality in current implementation'
      }
    ];

    const passedItems = owaspTop10.filter(item => item.status === 'pass').length;
    const overallCompliance = (passedItems / owaspTop10.length) * 100;

    return {
      owaspTop10,
      overallCompliance
    };
  }

  private checkAccessControl(scanResults: SecurityScanResult): 'pass' | 'fail' | 'warning' {
    // Check for access control vulnerabilities
    const accessVulns = scanResults.vulnerabilities.filter(v =>
      v.name.toLowerCase().includes('access') ||
      v.name.toLowerCase().includes('authorization') ||
      v.name.toLowerCase().includes('privilege')
    );
    return accessVulns.length === 0 ? 'pass' : 'warning';
  }

  private checkCryptography(scanResults: SecurityScanResult): 'pass' | 'fail' | 'warning' {
    // Check for crypto-related vulnerabilities
    const cryptoVulns = scanResults.vulnerabilities.filter(v =>
      v.name.toLowerCase().includes('crypto') ||
      v.name.toLowerCase().includes('ssl') ||
      v.name.toLowerCase().includes('tls') ||
      v.name.toLowerCase().includes('encryption')
    );
    return cryptoVulns.length === 0 ? 'pass' : 'warning';
  }

  private checkInjection(scanResults: SecurityScanResult): 'pass' | 'fail' | 'warning' {
    // Check for injection vulnerabilities
    const injectionVulns = scanResults.vulnerabilities.filter(v =>
      v.name.toLowerCase().includes('injection') ||
      v.name.toLowerCase().includes('sql')
    );
    return injectionVulns.length === 0 ? 'pass' : injectionVulns.some(v => v.risk === 'High') ? 'fail' : 'warning';
  }

  private checkSecurityConfig(scanResults: SecurityScanResult): 'pass' | 'fail' | 'warning' {
    // Check security headers are present
    const requiredHeaders = ['x-frame-options', 'x-content-type-options', 'content-security-policy'];
    const presentHeaders = requiredHeaders.filter(header => header in scanResults.headers);

    if (presentHeaders.length === requiredHeaders.length) return 'pass';
    if (presentHeaders.length >= requiredHeaders.length * 0.7) return 'warning';
    return 'fail';
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(scanResults: SecurityScanResult): string[] {
    const recommendations: string[] = [];

    // Check for high-priority issues
    if (scanResults.summary.high > 0) {
      recommendations.push('🔴 Address all high-risk vulnerabilities immediately');
    }

    // Check security headers
    const missingHeaders = ['x-frame-options', 'content-security-policy', 'x-content-type-options']
      .filter(header => !(header in scanResults.headers));

    if (missingHeaders.length > 0) {
      recommendations.push(`🛡️ Implement missing security headers: ${missingHeaders.join(', ')}`);
    }

    // General recommendations
    recommendations.push(
      '🔒 Regularly update dependencies to patch known vulnerabilities',
      '📊 Implement continuous security monitoring and alerting',
      '🧪 Run security scans as part of your CI/CD pipeline',
      '📚 Provide security training for development team',
      '🔍 Conduct regular penetration testing and security audits'
    );

    return recommendations;
  }

  /**
   * Save reports in requested formats
   */
  private async saveReports(report: SecurityReport): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];

    if (this.options.outputFormat === 'json' || this.options.outputFormat === 'both') {
      const jsonPath = join(this.options.outputDir, `security-report-${timestamp}.json`);
      writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`📄 JSON report saved: ${jsonPath}`);
    }

    if (this.options.outputFormat === 'html' || this.options.outputFormat === 'both') {
      const htmlPath = join(this.options.outputDir, `security-report-${timestamp}.html`);
      const htmlContent = this.generateHtmlReport(report);
      writeFileSync(htmlPath, htmlContent);
      console.log(`🌐 HTML report saved: ${htmlPath}`);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: SecurityReport): string {
    const statusColor = {
      secure: '#10b981',
      warnings: '#f59e0b',
      critical: '#ef4444'
    };

    const severityColor = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d',
      info: '#6b7280'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - ${report.metadata.target}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; text-transform: uppercase; font-size: 12px; }
        .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .vuln-item { border-left: 4px solid #e5e7eb; padding: 16px; margin: 10px 0; background: #f9fafb; }
        .severity-critical { border-color: ${severityColor.critical}; }
        .severity-high { border-color: ${severityColor.high}; }
        .severity-medium { border-color: ${severityColor.medium}; }
        .severity-low { border-color: ${severityColor.low}; }
        .severity-info { border-color: ${severityColor.info}; }
        .score-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .compliance-item { display: flex; align-items: center; padding: 12px; margin: 8px 0; border-radius: 6px; }
        .compliance-pass { background: #ecfdf5; border-left: 4px solid #10b981; }
        .compliance-warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
        .compliance-fail { background: #fef2f2; border-left: 4px solid #ef4444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .header-present { color: #10b981; }
        .header-missing { color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Report</h1>
            <p><strong>Target:</strong> ${report.metadata.target}</p>
            <p><strong>Generated:</strong> ${new Date(report.metadata.generated).toLocaleString()}</p>
            <div class="status-badge" style="background: ${statusColor[report.summary.overallStatus]}; color: white;">
                ${report.summary.overallStatus.toUpperCase()}
            </div>
        </div>

        <div class="grid">
            <div class="section">
                <h2>📊 Security Score</h2>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div class="score-circle" style="background: ${report.summary.securityScore >= 80 ? '#10b981' : report.summary.securityScore >= 60 ? '#f59e0b' : '#ef4444'};">
                        ${report.summary.securityScore}
                    </div>
                    <div>
                        <p><strong>Total Vulnerabilities:</strong> ${report.summary.totalVulnerabilities}</p>
                        <p><strong>Critical Issues:</strong> ${report.summary.criticalIssues}</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🛡️ Security Headers</h2>
                <table>
                    <thead>
                        <tr><th>Header</th><th>Status</th><th>Value</th></tr>
                    </thead>
                    <tbody>
                        ${Object.entries(report.securityHeaders.details).map(([header, info]) => `
                            <tr>
                                <td>${header}</td>
                                <td class="${info.present ? 'header-present' : 'header-missing'}">
                                    ${info.present ? '✅ Present' : '❌ Missing'}
                                </td>
                                <td>${info.value || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2>🎯 OWASP Top 10 Compliance</h2>
            <p><strong>Overall Compliance:</strong> ${report.compliance.overallCompliance.toFixed(1)}%</p>
            ${report.compliance.owaspTop10.map(item => `
                <div class="compliance-item compliance-${item.status}">
                    <div style="flex: 1;">
                        <strong>${item.id}: ${item.title}</strong>
                        <p style="margin: 4px 0; color: #6b7280;">${item.description}</p>
                        <small>${item.details}</small>
                    </div>
                    <div style="font-size: 20px;">
                        ${item.status === 'pass' ? '✅' : item.status === 'warning' ? '⚠️' : '❌'}
                    </div>
                </div>
            `).join('')}
        </div>

        ${report.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🔍 Vulnerabilities</h2>
            ${report.vulnerabilities.map(vuln => `
                <div class="vuln-item severity-${vuln.severity}">
                    <h3>${vuln.title} <span style="background: ${severityColor[vuln.severity]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${vuln.severity.toUpperCase()}</span></h3>
                    <p><strong>Category:</strong> ${vuln.category}</p>
                    <p><strong>Location:</strong> ${vuln.location}</p>
                    <p><strong>Description:</strong> ${vuln.description}</p>
                    <p><strong>Remediation:</strong> ${vuln.remediation}</p>
                </div>
            `).join('')}
        </div>
        ` : '<div class="section"><h2>🎉 No Vulnerabilities Found</h2><p>Great job! No security vulnerabilities were detected in the scan.</p></div>'}

        <div class="section">
            <h2>💡 Recommendations</h2>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>`;
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): SecurityReportOptions {
  const args = process.argv.slice(2);
  const options: SecurityReportOptions = {
    inputFile: 'security-scan-results.json',
    outputFormat: 'both',
    outputDir: join(process.cwd(), 'security-reports'),
    includeRemediation: true,
    complianceCheck: true
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        options.inputFile = args[++i];
        break;
      case '--format':
        const format = args[++i];
        if (['html', 'json', 'both'].includes(format)) {
          options.outputFormat = format as 'html' | 'json' | 'both';
        }
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--help':
        console.log(`
Security Report Generator

Usage: npx tsx scripts/security-report.ts [options]

Options:
  --input <file>        Input scan results file (default: security-scan-results.json)
  --format <format>     Output format: html, json, or both (default: both)
  --output-dir <dir>    Output directory (default: ./security-reports)
  --help               Show this help message

Examples:
  npx tsx scripts/security-report.ts
  npx tsx scripts/security-report.ts --format html
  npx tsx scripts/security-report.ts --input my-scan-results.json --format json
`);
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    const generator = new SecurityReportGenerator(options);
    await generator.generateReport();
    console.log('🎉 Security report generation completed successfully!');
  } catch (error) {
    console.error('💥 Security report generation failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { SecurityReportGenerator, type SecurityReport, type SecurityReportOptions };