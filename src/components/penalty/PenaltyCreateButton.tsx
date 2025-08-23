import React, { useState, useRef, useEffect } from 'react';
import { createPenalty } from '../../api/penalty';
import { validateDescription } from '../../utils/validation';
import { showToast } from '../common/Toast';
import type { Penalty } from '../../api/penalty';

interface PenaltyCreateButtonProps {
  onPenaltyCreated: (penalty: Penalty) => void;
}

export const PenaltyCreateButton: React.FC<PenaltyCreateButtonProps> = ({ onPenaltyCreated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isPersonal, setIsPersonal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for modal
  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModalOpen]);

  const openModal = () => {
    setIsModalOpen(true);
    setDescription('');
    setIsPersonal(false);
    setValidationError('');
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setDescription('');
      setIsPersonal(false);
      setValidationError('');
    }
  };

  const getCurrentUserUid = (): string | null => {
    // Get current user UID from localStorage or generate one like in http.ts
    const stored = localStorage.getItem('userUid');
    if (stored) return stored;
    
    // Generate and store a dev user ID similar to http.ts
    const devUserId = `user-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('userUid', devUserId);
    return devUserId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateDescription(description);
    if (!validation.ok) {
      setValidationError(validation.message || '');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const currentUserUid = getCurrentUserUid();
      const penalty = await createPenalty({
        description: description.trim(),
        userUid: isPersonal ? currentUserUid : null,
      });

      onPenaltyCreated(penalty);
      showToast('벌칙이 추가되었습니다.', 'success');
      closeModal();
    } catch (error: any) {
      let errorMessage = '등록에 실패했습니다. 잠시 후 다시 시도하세요.';
      
      if (error.response?.status) {
        switch (error.response.status) {
          case 400:
            errorMessage = '유효하지 않은 입력입니다.';
            break;
          case 401:
          case 403:
            errorMessage = '사용자 인증/권한이 필요합니다.';
            break;
          case 409:
            errorMessage = '이미 존재하는 벌칙입니다.';
            break;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        style={{
          padding: '0.6rem 1rem',
          borderRadius: '0.5rem',
          background: '#10b981',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '500',
        }}
        aria-label="벌칙 추가"
      >
        + 벌칙 추가
      </button>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="penalty-modal-title"
        >
          <div
            ref={modalRef}
            style={{
              backgroundColor: '#1f2937',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              minWidth: '400px',
              maxWidth: '90vw',
              color: '#f8fafc',
            }}
          >
            <h2
              id="penalty-modal-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
              }}
            >
              벌칙 추가
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor="penalty-description"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  }}
                >
                  벌칙 설명 *
                </label>
                <input
                  ref={firstInputRef}
                  id="penalty-description"
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setValidationError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="벌칙 내용을 입력해주세요 (1-60자)"
                  maxLength={60}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: validationError ? '1px solid #ef4444' : '1px solid #374151',
                    backgroundColor: '#374151',
                    color: '#f8fafc',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                  aria-invalid={!!validationError}
                  aria-describedby={validationError ? 'penalty-error' : undefined}
                />
                {validationError && (
                  <p
                    id="penalty-error"
                    role="alert"
                    style={{
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {validationError}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    disabled={isSubmitting}
                    style={{
                      marginRight: '0.5rem',
                      width: '1rem',
                      height: '1rem',
                    }}
                  />
                  나만 보기 (내 전용)
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #6b7280',
                    backgroundColor: 'transparent',
                    color: '#d1d5db',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: isSubmitting || !description.trim() ? '#4b5563' : '#3b82f6',
                    color: '#fff',
                    cursor: isSubmitting || !description.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};