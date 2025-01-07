'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(file);
    const formData = new FormData();
    formData.append('file', file!);
    fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid w-full max-w-sm items-center gap-1.5"
    >
      <Label htmlFor="file">PDF File</Label>
      <Input id="file" type="file" accept=".pdf" onChange={handleFileChange} />
      <Button type="submit">Upload</Button>
    </form>
  );
}
