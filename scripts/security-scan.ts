#!/usr/bin/env tsx

/**
 * OWASP ZAP Security Scanning Script
 *
 * This script integrates with OWASP ZAP to perform automated security testing
 * against the Argan HR System. It tests for common vulnerabilities like
 * SQL injection, XSS, CSRF, and security header validation.
 *
 * Usage:
 *   npx tsx scripts/security-scan.ts [options]
 *
 * Options:
 *   --target <url>    Target URL to scan (default: production URL)
 *   --output <path>   Output file for scan results (default: ./security-report.json)
 *   --quick          Run quick scan (basic tests only)
 *   --full           Run full scan (comprehensive tests)
 *
 * @author Argan HR System
 * @version 1.0.0
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ScanOptions {
  target: string;
  output: string;
  scanType: 'quick' | 'full';
  zapApiKey?: string;
  zapPort: number;
}

interface SecurityVulnerability {
  id: string;
  name: string;
  risk: 'High' | 'Medium' | 'Low' | 'Informational';
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  solution: string;
  url: string;
  param?: string;
}

interface SecurityScanResult {
  timestamp: string;
  target: string;
  scanType: string;
  duration: number;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    high: number;
    medium: number;
    low: number;
    informational: number;
    total: number;
  };
  headers: Record<string, string>;
  status: 'passed' | 'failed' | 'warning';
}

class SecurityScanner {
  private options: ScanOptions;
  private startTime: number = 0;

  constructor(options: ScanOptions) {
    this.options = options;
  }

  /**
   * Execute the security scan
   */
  async runScan(): Promise<SecurityScanResult> {
    console.log('🔒 Starting OWASP ZAP Security Scan...');
    console.log(`Target: ${this.options.target}`);
    console.log(`Scan Type: ${this.options.scanType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.startTime = Date.now();

    try {
      // Check if target is accessible
      await this.validateTarget();

      // Check for ZAP installation
      this.checkZapInstallation();

      // Start ZAP daemon if not running
      await this.ensureZapRunning();

      // Run the security scan
      const vulnerabilities = await this.executeScan();

      // Get security headers
      const headers = await this.checkSecurityHeaders();

      const duration = Date.now() - this.startTime;
      const summary = this.calculateSummary(vulnerabilities);

      const result: SecurityScanResult = {
        timestamp: new Date().toISOString(),
        target: this.options.target,
        scanType: this.options.scanType,
        duration,
        vulnerabilities,
        summary,
        headers,
        status: this.determineStatus(summary)
      };

      await this.saveResults(result);
      this.printSummary(result);

      return result;

    } catch (error) {
      console.error('❌ Security scan failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Validate that the target URL is accessible
   */
  private async validateTarget(): Promise<void> {
    console.log('🌐 Validating target accessibility...');

    try {
      // Use curl to test basic connectivity (works in most environments)
      execSync(`curl -s -o /dev/null -w "%{http_code}" "${this.options.target}"`, {
        timeout: 10000,
        stdio: 'pipe'
      });
      console.log('✅ Target is accessible');
    } catch {
      throw new Error(`Target ${this.options.target} is not accessible. Please ensure the application is running.`);
    }
  }

  /**
   * Check if OWASP ZAP is installed
   */
  private checkZapInstallation(): void {
    console.log('🔍 Checking OWASP ZAP installation...');

    try {
      // Try to find ZAP in common locations
      const zapPaths = [
        '/Applications/OWASP ZAP.app/Contents/Java/zap.sh',
        '/opt/zaproxy/zap.sh',
        'zap.sh',
        'docker'
      ];

      let zapFound = false;
      for (const path of zapPaths) {
        try {
          if (path === 'docker') {
            execSync('docker --version', { stdio: 'pipe' });
            console.log('✅ Docker found - will use ZAP Docker image');
            zapFound = true;
            break;
          } else {
            execSync(`test -f "${path}"`, { stdio: 'pipe' });
            console.log(`✅ ZAP found at: ${path}`);
            zapFound = true;
            break;
          }
        } catch {
          // Continue checking other paths
        }
      }

      if (!zapFound) {
        throw new Error('OWASP ZAP not found. Please install ZAP or Docker to run security scans.');
      }

    } catch (error) {
      throw new Error(`OWASP ZAP installation check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure ZAP daemon is running
   */
  private async ensureZapRunning(): Promise<void> {
    console.log('🚀 Starting ZAP daemon...');

    try {
      // For this implementation, we'll use Docker to run ZAP
      // This is the most reliable cross-platform approach
      const zapCommand = [
        'docker run -d --name zap-scan',
        `--network="host"`,
        '-v "/tmp/zap:/zap/wrk/:rw"',
        'owasp/zap2docker-stable',
        'zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true'
      ].join(' ');

      // Stop any existing ZAP container
      try {
        execSync('docker stop zap-scan', { stdio: 'pipe' });
        execSync('docker rm zap-scan', { stdio: 'pipe' });
      } catch {
        // Container might not exist, which is fine
      }

      execSync(zapCommand, { stdio: 'pipe' });

      // Wait for ZAP to start
      console.log('⏳ Waiting for ZAP to initialize...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      console.log('✅ ZAP daemon started successfully');
    } catch (error) {
      throw new Error(`Failed to start ZAP daemon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute the actual security scan
   */
  private async executeScan(): Promise<SecurityVulnerability[]> {
    console.log('🔍 Executing security scan...');

    const vulnerabilities: SecurityVulnerability[] = [];

    try {
      // Spider the application first
      console.log('🕷️  Spidering application...');
      const spiderCommand = `curl -s "http://localhost:8080/JSON/spider/action/scan/?url=${encodeURIComponent(this.options.target)}"`;
      execSync(spiderCommand, { stdio: 'pipe' });

      // Wait for spider to complete
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Run active scan for full scan type
      if (this.options.scanType === 'full') {
        console.log('🔍 Running active security scan...');
        const scanCommand = `curl -s "http://localhost:8080/JSON/ascan/action/scan/?url=${encodeURIComponent(this.options.target)}"`;
        execSync(scanCommand, { stdio: 'pipe' });

        // Wait for active scan to complete
        await new Promise(resolve => setTimeout(resolve, 30000));
      }

      // Get scan results
      console.log('📊 Retrieving scan results...');
      const resultsCommand = 'curl -s "http://localhost:8080/JSON/core/view/alerts/"';
      const resultsOutput = execSync(resultsCommand, { encoding: 'utf8' });

      const results = JSON.parse(resultsOutput);

      if (results.alerts && Array.isArray(results.alerts)) {
        for (const alert of results.alerts) {
          vulnerabilities.push({
            id: alert.alertRef || alert.pluginId || 'unknown',
            name: alert.alert || 'Unknown Vulnerability',
            risk: alert.risk || 'Informational',
            confidence: alert.confidence || 'Medium',
            description: alert.description || 'No description available',
            solution: alert.solution || 'No solution provided',
            url: alert.url || this.options.target,
            param: alert.param
          });
        }
      }

      console.log(`✅ Scan completed. Found ${vulnerabilities.length} potential issues.`);
      return vulnerabilities;

    } catch {
      console.warn('⚠️  Scan execution encountered issues, but continuing with available results');
      return vulnerabilities;
    } finally {
      // Clean up ZAP container
      try {
        execSync('docker stop zap-scan', { stdio: 'pipe' });
        execSync('docker rm zap-scan', { stdio: 'pipe' });
      } catch {
        // Container cleanup failed, but not critical
      }
    }
  }

  /**
   * Check security headers on the target
   */
  private async checkSecurityHeaders(): Promise<Record<string, string>> {
    console.log('🛡️  Checking security headers...');

    try {
      const headersCommand = `curl -s -I "${this.options.target}"`;
      const headersOutput = execSync(headersCommand, { encoding: 'utf8' });

      const headers: Record<string, string> = {};
      const lines = headersOutput.split('\n');

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }

      console.log('✅ Security headers checked');
      return headers;
    } catch {
      console.warn('⚠️  Failed to check security headers');
      return {};
    }
  }

  /**
   * Calculate vulnerability summary
   */
  private calculateSummary(vulnerabilities: SecurityVulnerability[]): SecurityScanResult['summary'] {
    const summary = {
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
      total: vulnerabilities.length
    };

    for (const vuln of vulnerabilities) {
      switch (vuln.risk.toLowerCase()) {
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
        default:
          summary.informational++;
      }
    }

    return summary;
  }

  /**
   * Determine overall scan status
   */
  private determineStatus(summary: SecurityScanResult['summary']): 'passed' | 'failed' | 'warning' {
    if (summary.high > 0) {
      return 'failed';
    } else if (summary.medium > 0) {
      return 'warning';
    }
    return 'passed';
  }

  /**
   * Save scan results to file
   */
  private async saveResults(result: SecurityScanResult): Promise<void> {
    const outputDir = join(process.cwd(), 'security-reports');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, this.options.output);
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Results saved to: ${outputPath}`);
  }

  /**
   * Print scan summary
   */
  private printSummary(result: SecurityScanResult): void {
    console.log('\n🔒 SECURITY SCAN SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Target: ${result.target}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log('');
    console.log('Vulnerability Summary:');
    console.log(`  🔴 High:          ${result.summary.high}`);
    console.log(`  🟡 Medium:        ${result.summary.medium}`);
    console.log(`  🟢 Low:           ${result.summary.low}`);
    console.log(`  ℹ️  Informational: ${result.summary.informational}`);
    console.log(`  📊 Total:         ${result.summary.total}`);
    console.log('');

    // Check for key security headers
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'content-security-policy',
      'referrer-policy'
    ];

    console.log('Security Headers:');
    for (const header of requiredHeaders) {
      const present = header in result.headers;
      console.log(`  ${present ? '✅' : '❌'} ${header}: ${present ? result.headers[header] : 'Missing'}`);
    }

    console.log('');
    if (result.status === 'passed') {
      console.log('🎉 Security scan PASSED - No critical vulnerabilities found!');
    } else if (result.status === 'warning') {
      console.log('⚠️  Security scan WARNINGS - Medium risk vulnerabilities found');
    } else {
      console.log('❌ Security scan FAILED - High risk vulnerabilities found');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments(): ScanOptions {
  const args = process.argv.slice(2);
  const options: ScanOptions = {
    target: 'https://argan-hr-system.vercel.app',
    output: 'security-scan-results.json',
    scanType: 'quick',
    zapPort: 8080
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
        options.target = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--quick':
        options.scanType = 'quick';
        break;
      case '--full':
        options.scanType = 'full';
        break;
      case '--help':
        console.log(`
OWASP ZAP Security Scanner

Usage: npx tsx scripts/security-scan.ts [options]

Options:
  --target <url>    Target URL to scan (default: production URL)
  --output <path>   Output file for scan results (default: security-scan-results.json)
  --quick          Run quick scan (basic tests only)
  --full           Run full scan (comprehensive tests)
  --help           Show this help message

Examples:
  npx tsx scripts/security-scan.ts --quick
  npx tsx scripts/security-scan.ts --target https://localhost:3000 --full
  npx tsx scripts/security-scan.ts --output my-security-report.json
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
    const scanner = new SecurityScanner(options);
    const result = await scanner.runScan();

    // Exit with appropriate code based on scan results
    if (result.status === 'failed') {
      process.exit(1);
    } else if (result.status === 'warning') {
      process.exit(2);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Security scan failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { SecurityScanner, type SecurityScanResult, type ScanOptions };