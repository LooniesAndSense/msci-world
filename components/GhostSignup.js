'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button } from "@heroui/react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";

const GhostSignup = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  
  // Only access theme after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use the resolved theme which accounts for system preferences
  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    setStatus('loading');
    
    try {
      // Replace with your Ghost site URL
      const ghostSiteUrl = 'https://www.looniesandsense.com';
      
      // Step 1: First fetch the integrity token
      let integrityTokenResponse = await fetch(`${ghostSiteUrl}/members/api/integrity-token/`, {
        headers: {
          'app-pragma': 'no-cache',
          'x-ghost-version': '5.98'
        },
        method: 'GET'
      });
      
      if (!integrityTokenResponse.ok) {
        throw new Error('Failed to get integrity token');
      }
      
      const integrityToken = await integrityTokenResponse.text();
      
      // Step 2: Send the subscription request with the integrity token
      const response = await fetch(`${ghostSiteUrl}/members/api/send-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          emailType: 'subscribe',
          integrityToken: integrityToken
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Subscription failed');
      }
      
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Error subscribing:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Subscription failed. Please try again later.');
    }
  };
  
  // Reset error state when user starts typing again
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (status === 'error') {
      setStatus('idle');
    }
  };
  
  // Ensure we have a good placeholder while waiting for theme to be detected
  if (!mounted) {
    return (
      <div className="w-full rounded-xl px-4 py-3 mb-4 bg-zinc-900 dark:bg-zinc-900">
        <div className="flex flex-row items-center justify-between gap-3 w-full">
          <div className="flex-none">
            <h3 className="text-sm font-medium mb-0 text-white">Subscribe to the Loonies and Sense newsletter</h3>
            <p className="text-xs text-gray-400">Personal finance for Canadian DIY investors</p>
          </div>
          <div className="flex flex-1 flex-row items-center gap-2 justify-end">
            <div className="relative flex-1 max-w-md opacity-70">
              <Input
                type="email"
                size="sm"
                placeholder="Your email address"
                startContent={<Mail size={16} />}
                disabled={true}
              />
            </div>
            <Button
              color="primary"
              size="sm"
              className="px-4"
              disabled={true}
            >
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`w-full rounded-xl px-4 py-3 mb-4 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
      <form onSubmit={handleSubmit} className="flex flex-row items-center justify-between gap-3 w-full">
        <div className="flex-none">
          <h3 className={`text-sm font-medium mb-0 ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
            Subscribe to the Loonies and Sense newsletter
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Personal finance for Canadian DIY investors
          </p>
        </div>
        
        <div className="flex flex-1 flex-row items-center gap-2 justify-end">
          <div className="relative flex-1 max-w-md">
            <Input
              value={email}
              onChange={handleEmailChange}
              placeholder="Your email address"
              type="email"
              size="sm"
              startContent={<Mail size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />}
              className={`w-full ${isDarkMode ? 'dark' : ''}`}
              classNames={{
                inputWrapper: isDarkMode ? 
                  "bg-zinc-800 data-[hover=true]:bg-zinc-700 group-data-[focus=true]:bg-zinc-700" : 
                  "bg-gray-100 data-[hover=true]:bg-gray-200 group-data-[focus=true]:bg-gray-200"
              }}
              disabled={status === 'loading' || status === 'success'}
            />
            {status === 'error' && (
              <div className="absolute -bottom-5 left-0 text-xs text-red-500 flex items-center">
                <AlertCircle size={12} className="mr-1" />
                {errorMessage}
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            color="primary"
            isLoading={status === 'loading'}
            size="sm"
            className="px-4"
            endContent={status === 'success' ? <CheckCircle size={16} /> : null}
          >
            {status === 'success' ? 'Subscribed' : 'Subscribe'}
          </Button>
        </div>
      </form>
      
      {status === 'success' && (
        <div className="mt-2 text-right text-xs text-green-500 flex items-center justify-end">
          <CheckCircle size={12} className="mr-1" />
          Thank you! Please check your email to confirm.
        </div>
      )}
    </div>
  );
};

export default GhostSignup;