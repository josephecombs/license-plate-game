#!/usr/bin/env node

/**
 * Test Runner for License Plate Game Cloudflare Worker
 * 
 * This script runs all tests in the proper order and provides
 * a summary of test results.
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const TEST_DIR = './test';
const SRC_DIR = '../src';

console.log('🧪 License Plate Game - Test Suite');
console.log('=====================================\n');

// Function to find all test files recursively
function findTestFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to run tests for a specific category
function runTestCategory(category, testFiles) {
  console.log(`\n📁 Testing ${category}:`);
  console.log('-'.repeat(category.length + 10));
  
  const categoryTests = testFiles.filter(file => file.includes(category));
  
  if (categoryTests.length === 0) {
    console.log('No tests found for this category.');
    return;
  }
  
  categoryTests.forEach(testFile => {
    const relativePath = testFile.replace('./test/', '');
    console.log(`  Running: ${relativePath}`);
    
    try {
      execSync(`npx vitest run ${testFile}`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log(`  ✅ ${relativePath} - PASSED`);
    } catch (error) {
      console.log(`  ❌ ${relativePath} - FAILED`);
      process.exitCode = 1;
    }
  });
}

// Main test execution
async function runAllTests() {
  try {
    console.log('🔍 Discovering test files...');
    const testFiles = findTestFiles(TEST_DIR);
    
    if (testFiles.length === 0) {
      console.log('❌ No test files found!');
      process.exit(1);
    }
    
    console.log(`📊 Found ${testFiles.length} test files\n`);
    
    // Run tests by category
    const categories = [
      'constants',
      'lib',
      'routes', 
      'durable-objects',
      'index'
    ];
    
    categories.forEach(category => {
      runTestCategory(category, testFiles);
    });
    
    console.log('\n🎯 Test Summary');
    console.log('================');
    console.log(`Total test files: ${testFiles.length}`);
    
    if (process.exitCode === 1) {
      console.log('❌ Some tests failed. Please check the output above.');
      process.exit(1);
    } else {
      console.log('✅ All tests passed successfully!');
    }
    
  } catch (error) {
    console.error('💥 Test runner error:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
