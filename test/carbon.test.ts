// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import AdSense from '../components/AdSense';

describe('AdSense component', () => {
  it('renders fallback when no client id is provided', () => {
    const { container, getByText } = render(React.createElement(AdSense, null) as any);
    expect(container.querySelector('#adsense-container')).toBeTruthy();
    // fallback should show because there's no NEXT_PUBLIC_ADSENSE_CLIENT in test env
    expect(getByText(/Ad slot blocked or not available/i)).toBeTruthy();
  });
});
