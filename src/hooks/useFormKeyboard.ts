'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useFormKeyboard() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isFormField = ['input', 'select', 'textarea'].includes(tag);

      if (e.key === 'Escape') {
        if (!isFormField || tag === 'select') {
          router.push('/dashboard');
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const submitBtn = document.querySelector<HTMLButtonElement>('button[type="submit"]');
        if (submitBtn) {
          submitBtn.click();
        } else {
          const form = document.querySelector<HTMLFormElement>('form');
          if (form) {
            if (form.checkValidity()) form.submit();
            else form.reportValidity();
          }
        }
        return;
      }

      if (!isFormField) return;

      const formElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([type="submit"]):not([readonly]), select, textarea, button.save-btn'
        )
      );
      const current = e.target as HTMLElement;
      const idx = formElements.indexOf(current);
      if (idx === -1) return;

      let next: HTMLElement | null = null;

      if (e.key === 'ArrowDown') {
        if (tag !== 'select' && idx < formElements.length - 1) {
          e.preventDefault();
          next = formElements[idx + 1];
        }
      } else if (e.key === 'ArrowUp') {
        if (tag !== 'select' && idx > 0) {
          e.preventDefault();
          next = formElements[idx - 1];
        }
      } else if (e.key === 'ArrowRight') {
        const input = current as HTMLInputElement;
        if (tag === 'select' || input.type === 'number' || input.selectionEnd === input.value.length) {
          if (idx < formElements.length - 1) {
            e.preventDefault();
            next = formElements[idx + 1];
          }
        }
      } else if (e.key === 'ArrowLeft') {
        const input = current as HTMLInputElement;
        if (tag === 'select' || input.type === 'number' || input.selectionStart === 0) {
          if (idx > 0) {
            e.preventDefault();
            next = formElements[idx - 1];
          }
        }
      }

      if (next) {
        next.focus();
        if (typeof (next as HTMLInputElement).select === 'function') {
          (next as HTMLInputElement).select();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
