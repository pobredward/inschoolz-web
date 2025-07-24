'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { checkUserNameAvailability } from '@/lib/api/users';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { FormDataType } from '@/types';

// 휴대폰 번호 포맷팅 함수
const formatPhoneNumber = (value: string): string => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else {
    return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  }
};

const detailedInfoSchema = z.object({
  userName: z.string()
    .min(5, { message: '아이디는 최소 5자 이상이어야 합니다.' })
    .max(20, { message: '아이디는 최대 20자까지 가능합니다.' })
    .regex(/^[a-z0-9]+$/, { message: '아이디는 영문 소문자와 숫자만 사용 가능합니다.' }),
  realName: z.string()
    .min(2, { message: '이름을 입력해주세요.' }),
  gender: z.string().optional(),
  birthYear: z.number().optional(),
  birthMonth: z.number().optional(),
  birthDay: z.number().optional(),
  phoneNumber: z.string().optional(),
  referral: z.string().optional(),
  // 약관 동의
  termsAgreed: z.boolean().refine(value => value === true, {
    message: '서비스 이용약관에 동의해야 합니다.',
  }),
  privacyAgreed: z.boolean().refine(value => value === true, {
    message: '개인정보 처리방침에 동의해야 합니다.',
  }),
  locationAgreed: z.boolean().refine(value => value === true, {
    message: '위치기반 서비스 이용약관에 동의해야 합니다.',
  }),
  marketingAgreed: z.boolean().optional(),
});

type DetailedInfoValues = z.infer<typeof detailedInfoSchema>;

interface DetailedInfoStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
  onSubmit: () => void;
}

export function DetailedInfoStep({ formData, updateFormData, onSubmit }: DetailedInfoStepProps) {
  // 약관 전체 동의 상태
  const [allAgreed, setAllAgreed] = useState(false);
  const [userNameStatus, setUserNameStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({ status: 'idle' });
  const [emailStatus, setEmailStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({ status: 'idle' });
  const [referralStatus, setReferralStatus] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  const [allChecked, setAllChecked] = useState(
    formData.agreements?.terms && formData.agreements?.privacy && formData.agreements?.location
  );

  const form = useForm<DetailedInfoValues>({
    resolver: zodResolver(detailedInfoSchema),
    defaultValues: {
      userName: formData.userName || '',
      realName: formData.realName || '',
      gender: formData.gender || '',
      birthYear: formData.birthYear || new Date().getFullYear() - 15,
      birthMonth: formData.birthMonth || 1,
      birthDay: formData.birthDay || 1,
      phoneNumber: formData.phoneNumber || '',
      referral: formData.referral || '',
      termsAgreed: formData.agreements?.terms || false,
      privacyAgreed: formData.agreements?.privacy || false,
      locationAgreed: formData.agreements?.location || false,
      marketingAgreed: formData.agreements?.marketing || false,
    },
  });

  const handleFieldChange = (field: keyof DetailedInfoValues, value: any) => {
    form.setValue(field, value);
    if (field.includes('Agreed')) {
      // 약관 동의 필드인 경우
      const agreementField = field.replace('Agreed', '') as 'terms' | 'privacy' | 'location' | 'marketing';
      updateFormData({
        agreements: {
          ...formData.agreements,
          [agreementField]: value
        }
      });
    } else {
      updateFormData({ [field]: value });
    }
  };

  // 사용자명 중복 체크 함수
  const checkUserName = useCallback(async (userName: string) => {
    if (!userName || userName.trim() === '') {
      setUserNameStatus({ status: 'idle' });
      return;
    }

    setUserNameStatus({ status: 'checking' });

    try {
      const result = await checkUserNameAvailability(userName);
      if (result.isAvailable) {
        setUserNameStatus({ 
          status: 'available', 
          message: result.message 
        });
      } else {
        setUserNameStatus({ 
          status: 'unavailable', 
          message: result.message 
        });
      }
    } catch {
      setUserNameStatus({ 
        status: 'unavailable', 
        message: '검증 중 오류가 발생했습니다.' 
      });
    }
  }, []);

  // 사용자명 입력 디바운싱
  useEffect(() => {
    const userNameValue = form.watch('userName');
    if (!userNameValue) {
      setUserNameStatus({ status: 'idle' });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUserName(userNameValue);
    }, 300); // 500ms에서 300ms로 단축

    return () => clearTimeout(timeoutId);
  }, [form.watch('userName'), checkUserName]);

  // 사용자명 필드에서 포커스가 벗어날 때 즉시 검증
  const handleUserNameBlur = () => {
    const userNameValue = form.getValues('userName');
    if (userNameValue && userNameValue.trim() !== '') {
      checkUserName(userNameValue);
    }
  };

  const toggleAllAgreements = (checked: boolean) => {
    setAllChecked(checked);
    
    form.setValue('termsAgreed', checked);
    form.setValue('privacyAgreed', checked);
    form.setValue('locationAgreed', checked);
    form.setValue('marketingAgreed', checked);
    
    updateFormData({
      agreements: {
        terms: checked,
        privacy: checked,
        location: checked,
        marketing: checked,
      }
    });
  };

  const handleSubmitForm = (values: DetailedInfoValues) => {
    // 약관 동의 정보를 올바른 형태로 변환
    const agreementsData = {
      terms: values.termsAgreed,
      privacy: values.privacyAgreed,
      location: values.locationAgreed,
      marketing: values.marketingAgreed || false,
    };

    updateFormData({
      ...values,
      agreements: agreementsData,
    });
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">세부 정보 입력</h2>
      </div>
      <p className="text-sm text-gray-600">개인정보와 약관 동의를 입력해주세요.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
          {/* 개인정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">개인정보</h3>
            
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="영문, 숫자 조합 5-20자" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange('userName', e.target.value);
                        }}
                        onBlur={handleUserNameBlur}
                      />
                      {userNameStatus.status === 'checking' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                      {userNameStatus.status === 'available' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                      {userNameStatus.status === 'unavailable' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {userNameStatus.message && (
                    <p className={`text-sm ${
                      userNameStatus.status === 'available' 
                        ? 'text-green-600' 
                        : userNameStatus.status === 'unavailable'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {userNameStatus.message}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="realName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>실명</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="실명을 입력하세요" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('realName', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>성별 (선택사항)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFieldChange('gender', value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="성별을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>출생년도 (선택사항)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        inputMode="numeric"
                        placeholder="2000" 
                        maxLength={4}
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                          const numValue = parseInt(value) || 0;
                          field.onChange(numValue);
                          handleFieldChange('birthYear', numValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>월</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        inputMode="numeric"
                        placeholder="01" 
                        maxLength={2}
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                          if (value.length <= 2) {
                            const numValue = parseInt(value) || 0;
                            if (numValue >= 1 && numValue <= 12) {
                              field.onChange(numValue);
                              handleFieldChange('birthMonth', numValue);
                            } else if (value === '' || numValue === 0) {
                              field.onChange(0);
                              handleFieldChange('birthMonth', 0);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>일</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        inputMode="numeric"
                        placeholder="01" 
                        maxLength={2}
                        value={field.value ? String(field.value) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                          if (value.length <= 2) {
                            const numValue = parseInt(value) || 0;
                            if (numValue >= 1 && numValue <= 31) {
                              field.onChange(numValue);
                              handleFieldChange('birthDay', numValue);
                            } else if (value === '' || numValue === 0) {
                              field.onChange(0);
                              handleFieldChange('birthDay', 0);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>휴대폰번호 (선택사항)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="010-1234-5678" 
                      maxLength={13}
                      value={field.value ? formatPhoneNumber(field.value) : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 숫자만 추출
                        field.onChange(value); // 숫자만 저장
                        handleFieldChange('phoneNumber', value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>추천인 아이디 (선택)</FormLabel>
                  <FormControl>
                    {/* ReferralSearch component was removed, so this field is now a simple Input */}
                    <Input 
                      placeholder="추천인 아이디를 입력하세요" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFieldChange('referral', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Separator was removed, so this section is removed */}

          {/* 약관 동의 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">약관 동의</h3>
            
            {/* 전체 동의 */}
            <div className="bg-gray-50 p-4 rounded-lg border flex items-center gap-3">
              <Checkbox 
                id="all-agree" 
                checked={allChecked}
                onCheckedChange={(checked) => toggleAllAgreements(checked as boolean)}
              />
              <label
                htmlFor="all-agree"
                className="text-lg font-medium cursor-pointer flex-1"
              >
                모든 약관에 동의합니다
              </label>
            </div>
            
            {/* Separator was removed, so this section is removed */}
            
            {/* 개별 약관 동의 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="termsAgreed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleFieldChange('termsAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [필수] 서비스 이용약관
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privacyAgreed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleFieldChange('privacyAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [필수] 개인정보 수집 및 이용 동의
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locationAgreed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleFieldChange('locationAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [필수] 위치기반 서비스 이용약관
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketingAgreed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleFieldChange('marketingAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [선택] 마케팅 정보 수신 동의
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 