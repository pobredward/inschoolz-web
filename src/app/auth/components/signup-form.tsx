'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper, Step } from '@/components/ui/stepper';
import { signUp } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { BasicInfoStep } from './signup-steps/basic-info';
import { SchoolSelectionStep } from './signup-steps/school-selection';
import { RegionInfoStep } from './signup-steps/region-info';
import { TermsAgreementStep } from './signup-steps/terms-agreement';

const steps = [
  { id: 'basic-info', title: '기본 정보' },
  { id: 'school-selection', title: '학교 선택' },
  { id: 'region-info', title: '지역 정보' },
  { id: 'terms-agreement', title: '약관 동의' },
];

export function SignupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // 기본 정보
    userName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    realName: '',
    gender: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    phone: '',
    verificationCode: '',
    referral: '',
    
    // 학교 정보
    school: '',
    schoolName: '',
    grade: '',
    classNumber: '',
    studentNumber: '',
    favoriteSchools: [] as string[],
    
    // 지역 정보
    province: '',
    city: '',
    
    // 약관 동의
    termsAgreed: false,
    privacyAgreed: false,
    locationAgreed: false,
    marketingAgreed: false,
    
    // 타입 호환성을 위해 빈 배열로 유지
    interests: [] as string[],
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      toast.error("가입 정보 오류", {
        description: "이메일과 비밀번호는 필수 입력 항목입니다."
      });
      setCurrentStep(0); // 기본 정보 단계로 이동
      return;
    }

    if (!formData.termsAgreed || !formData.privacyAgreed || !formData.locationAgreed) {
      toast.error("약관 동의 필요", {
        description: "필수 이용약관에 모두 동의해주세요."
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Firebase에 회원가입 요청
      await signUp(formData);
      
      toast.success("회원가입 성공", {
        description: "이메일 인증 메일을 발송했습니다. 이메일을 확인해주세요."
      });
      
      // 이메일 인증 페이지로 이동
      router.push('/auth/verify-email');
    } catch (error) {
      console.error('회원가입 오류:', error);
      
      const errorMessage = error instanceof Error ? error.message : "회원가입 처리 중 오류가 발생했습니다.";
      
      toast.error("회원가입 실패", {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Stepper currentStep={currentStep} className="mb-8">
        {steps.map((step, index) => (
          <Step
            key={step.id}
            title={step.title}
            description={`단계 ${index + 1}`}
            isCompleted={index < currentStep}
            isActive={index === currentStep}
          />
        ))}
      </Stepper>

      <Card className="p-6">
        {currentStep === 0 && (
          <BasicInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        {currentStep === 1 && (
          <SchoolSelectionStep 
            formData={formData} 
            updateFormData={updateFormData}
            nextStep={handleNext}
          />
        )}
        {currentStep === 2 && (
          <RegionInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        {currentStep === 3 && (
          <TermsAgreementStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            이전
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              다음
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 처리 중...
                </>
              ) : (
                "가입하기"
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
} 