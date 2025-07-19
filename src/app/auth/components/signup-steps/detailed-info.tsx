'use client';

import { useState, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { checkReferralExists } from '@/lib/api/schools';
import { CheckCircle, XCircle, Loader2, FileText, Info } from 'lucide-react';
import { ReferralSearch } from '@/components/ui/referral-search';

const detailedInfoSchema = z.object({
  userName: z.string()
    .min(5, { message: '아이디는 최소 5자 이상이어야 합니다.' })
    .max(20, { message: '아이디는 최대 20자까지 가능합니다.' })
    .regex(/^[a-z0-9]+$/, { message: '아이디는 영문 소문자와 숫자만 사용 가능합니다.' }),
  realName: z.string()
    .min(2, { message: '이름을 입력해주세요.' }),
  gender: z.string()
    .min(1, { message: '성별을 선택해주세요.' }),
  birthYear: z.number()
    .min(1950, { message: '올바른 연도를 입력해주세요.' })
    .max(new Date().getFullYear(), { message: '올바른 연도를 입력해주세요.' }),
  birthMonth: z.number()
    .min(1, { message: '올바른 월을 입력해주세요.' })
    .max(12, { message: '올바른 월을 입력해주세요.' }),
  birthDay: z.number()
    .min(1, { message: '올바른 일을 입력해주세요.' })
    .max(31, { message: '올바른 일을 입력해주세요.' }),
  phoneNumber: z.string()
    .regex(/^\d{10,11}$/, { message: '올바른 휴대폰 번호를 입력해주세요. (10-11자리)' }),
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
  formData: {
    userName: string;
    realName: string;
    gender: string;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    phoneNumber: string;
    referral: string;
    agreements: {
      terms: boolean;
      privacy: boolean;
      location: boolean;
      marketing: boolean;
    };
  };
  updateFormData: (data: Partial<any>) => void;
  onSubmit: () => void;
}

export function DetailedInfoStep({ formData, updateFormData, onSubmit }: DetailedInfoStepProps) {
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

  const checkReferral = useCallback(async (referralCode: string) => {
    if (!referralCode || referralCode.length < 3) {
      setReferralStatus({ status: 'idle' });
      return;
    }

    setReferralStatus({ status: 'checking' });
    
    try {
      const exists = await checkReferralExists(referralCode);
      if (exists) {
        setReferralStatus({ 
          status: 'valid', 
          message: '유효한 추천인 아이디입니다.' 
        });
      } else {
        setReferralStatus({ 
          status: 'invalid', 
          message: '존재하지 않는 추천인 아이디입니다.' 
        });
      }
    } catch (error) {
      setReferralStatus({ 
        status: 'invalid', 
        message: '추천인 확인 중 오류가 발생했습니다.' 
      });
    }
  }, []);

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
        <FileText className="h-5 w-5 text-green-600" />
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
                    <Input 
                      placeholder="영문, 숫자 조합 5-20자" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('userName', e.target.value);
                      }}
                    />
                  </FormControl>
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
                  <FormLabel>성별</FormLabel>
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
                    <FormLabel>출생년도</FormLabel>
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
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                          const numValue = parseInt(value) || 0;
                          field.onChange(numValue);
                          handleFieldChange('birthMonth', numValue);
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
                        {...field} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                          const numValue = parseInt(value) || 0;
                          field.onChange(numValue);
                          handleFieldChange('birthDay', numValue);
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
                  <FormLabel>휴대폰번호</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="01012345678" 
                      maxLength={11}
                      {...field} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                        field.onChange(e);
                        e.target.value = value; // 실제 input 값도 숫자만으로 업데이트
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
                    <ReferralSearch
                      value={field.value}
                      onSelect={(user) => {
                        const referralValue = user ? user.userName : '';
                        field.onChange(referralValue);
                        handleFieldChange('referral', referralValue);
                      }}
                      placeholder="추천인 아이디를 검색하세요"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* 약관 동의 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">약관 동의</h3>
            
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700 flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>서비스 이용을 위해 필수 약관에 동의해 주세요. 필수 약관에 동의하지 않을 경우 서비스 이용이 제한됩니다.</span>
              </p>
            </div>
            
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
            
            <Separator className="my-4" />
            
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