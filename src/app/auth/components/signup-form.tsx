'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper, Step } from '@/components/ui/stepper';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { FormDataType } from '@/types';


import { EmailPasswordStep } from './signup-steps/email-password';
import { SchoolSelectionStep } from './signup-steps/school-selection';
import { RegionInfoStep } from './signup-steps/region-info';
import { DetailedInfoStep } from './signup-steps/detailed-info';

const steps = [
  { id: 'email-password', title: '기본 정보' },
  { id: 'school-selection', title: '학교 선택' },
  { id: 'region-info', title: '지역 정보' },
  { id: 'detailed-info', title: '세부 정보' },
];

export function SignupForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBasicInfoValid, setIsBasicInfoValid] = useState(false);
  
  const [formData, setFormData] = useState<FormDataType>({
    // 1단계: 이메일, 비밀번호
    email: '',
    password: '',
    passwordConfirm: '',
    verificationCode: '',
    
    // 2단계: 학교 정보
    school: {
      id: '',
      name: '',
      grade: null,
      classNumber: null,
      studentNumber: null,
      isGraduate: null,
    },
    favoriteSchools: [] as string[],
    
    // 3단계: 지역 정보
    regions: {
      sido: '',
      sigungu: '',
      address: '',
    },
    
    // 4단계: 세부 정보
    userName: '',
    realName: '',
    gender: '',
    birthYear: 0,
    birthMonth: 0,
    birthDay: 0,
    phoneNumber: '',
    referral: '',
    
    // 4단계: 약관 동의
    agreements: {
      terms: false,
      privacy: false,
      location: false,
      marketing: false,
    },
    
    // 기타
    profileImage: null as File | null,
    interests: [] as string[],
  });

  const updateFormData = (data: Partial<FormDataType>) => {
    setFormData((prev: FormDataType) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    // 기본 정보 단계에서는 검증이 완료되어야만 다음으로 이동 가능
    if (currentStep === 0 && !isBasicInfoValid) {
      toast.error("입력 확인 필요", {
        description: "모든 필수 정보를 올바르게 입력하고 중복 확인을 완료해주세요."
      });
      return;
    }

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

    if (!formData.agreements.terms || !formData.agreements.privacy || !formData.agreements.location) {
      toast.error("약관 동의 필요", {
        description: "필수 이용약관에 모두 동의해주세요."
      });
      return;
    }

    // userName 중복 체크
    if (formData.userName) {
      try {
        const { checkUserNameAvailability } = await import('@/lib/api/users');
        const userNameCheck = await checkUserNameAvailability(formData.userName);
        if (!userNameCheck.isAvailable) {
          toast.error("사용자명 오류", {
            description: userNameCheck.message
          });
          setCurrentStep(0); // 기본 정보 단계로 이동
          return;
        }
      } catch (error) {
        toast.error("사용자명 확인 오류", {
          description: "사용자명 확인 중 오류가 발생했습니다."
        });
        return;
      }
    }

    // 이메일 중복 체크
    if (formData.email) {
      try {
        const { checkEmailAvailability } = await import('@/lib/api/users');
        const emailCheck = await checkEmailAvailability(formData.email);
        if (!emailCheck.isAvailable) {
          toast.error("이메일 오류", {
            description: emailCheck.message
          });
          setCurrentStep(0); // 기본 정보 단계로 이동
          return;
        }
      } catch (error) {
        toast.error("이메일 확인 오류", {
          description: "이메일 확인 중 오류가 발생했습니다."
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      console.log('🚀 SignupForm: 회원가입 요청 시작');
      
      // Firebase에 회원가입 요청
      await signUp(formData);
      
      console.log('✅ SignupForm: 회원가입 완료, 홈페이지로 이동');
      
      toast.success("회원가입 성공", {
        description: "회원가입이 완료되었습니다. 환영합니다!"
      });
      
      // 잠시 후 메인 페이지로 이동 (AuthProvider 상태 업데이트 대기)
      setTimeout(() => {
        console.log('🏠 SignupForm: 홈페이지로 리다이렉트');
        router.push('/');
      }, 2000); // 2초로 늘려서 충분히 기다리게 함
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

      <Card className="md:p-6 p-1 md:border md:shadow-sm border-none shadow-none">
        {currentStep === 0 && (
          <EmailPasswordStep 
            formData={formData} 
            updateFormData={updateFormData}
            onNext={handleNext}
            onValidationChange={setIsBasicInfoValid}
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
          <DetailedInfoStep 
            formData={formData} 
            updateFormData={updateFormData}
            onSubmit={handleSubmit}
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
            <Button 
              onClick={handleNext} 
              disabled={isSubmitting || (currentStep === 0 && !isBasicInfoValid)}
            >
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