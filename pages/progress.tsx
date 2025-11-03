import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import React from 'react';
import ReactMarkdown from 'react-markdown';

type Props = { md: string };

export default function ProgressPage({ md }: Props) {
  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <Head>
        <title>Project Progress</title>
      </Head>
      <h1>Project Progress</h1>
      <div style={{ maxWidth: 900 }}>
        <ReactMarkdown>{md}</ReactMarkdown>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const docPath = path.join(process.cwd(), 'documentation', 'next_actions.md');
  let md = 'No progress file found.';
  try {
    md = fs.readFileSync(docPath, 'utf8');
  } catch (e) {
    console.error('Failed to read progress file', e);
  }
  return { props: { md } };
}
