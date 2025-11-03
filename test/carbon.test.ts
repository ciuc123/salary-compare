// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import CarbonAd from '../components/CarbonAd';

describe('CarbonAd component', () => {
  it('renders container with expected id', () => {
    const { container } = render(React.createElement(CarbonAd, null) as any);
    expect(container.querySelector('#carbon-container')).toBeTruthy();
  });
});
