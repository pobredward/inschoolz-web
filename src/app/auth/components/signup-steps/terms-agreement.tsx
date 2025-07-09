'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FileText, Info, Shield } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

const termsAgreementSchema = z.object({
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

type TermsAgreementValues = z.infer<typeof termsAgreementSchema>;

type FormDataType = {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  locationAgreed: boolean;
  marketingAgreed: boolean;
};

interface TermsAgreementStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
}

export function TermsAgreementStep({ formData, updateFormData }: TermsAgreementStepProps) {
  const [allChecked, setAllChecked] = useState(
    formData.termsAgreed && formData.privacyAgreed && formData.locationAgreed
  );

  const form = useForm<TermsAgreementValues>({
    resolver: zodResolver(termsAgreementSchema),
    defaultValues: {
      termsAgreed: formData.termsAgreed || false,
      privacyAgreed: formData.privacyAgreed || false,
      locationAgreed: formData.locationAgreed || false,
      marketingAgreed: formData.marketingAgreed || false,
    },
  });

  const toggleAllAgreements = (checked: boolean) => {
    setAllChecked(checked);
    
    form.setValue('termsAgreed', checked);
    form.setValue('privacyAgreed', checked);
    form.setValue('locationAgreed', checked);
    form.setValue('marketingAgreed', checked);
    
    // 상위 컴포넌트에 데이터 전달
    updateFormData({
      termsAgreed: checked,
      privacyAgreed: checked,
      locationAgreed: checked,
      marketingAgreed: checked,
    });
  };

  const handleCheckboxChange = (field: keyof FormDataType, checked: boolean) => {
    form.setValue(field, checked);
    updateFormData({ [field]: checked });
    
    // 모든 필수 항목이 체크되어 있는지 확인하고 전체 동의 체크박스 업데이트
    const values = form.getValues();
    const requiredChecked = values.termsAgreed && values.privacyAgreed && values.locationAgreed;
    setAllChecked(requiredChecked);
  };

  const onSubmit = (values: TermsAgreementValues) => {
    updateFormData(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-bold">약관 동의</h2>
      </div>
      
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* 서비스 이용약관 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
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
                          handleCheckboxChange('termsAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [필수] 서비스 이용약관
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <Accordion type="single" collapsible className="bg-gray-50 rounded-md px-4">
              <AccordionItem value="terms" className="border-none">
                <AccordionTrigger className="text-sm text-gray-500 py-2">
                  내용 보기
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 max-h-40 overflow-y-auto border-t pt-2">
                  <p>제1조 (목적)</p>
                  <p>이 약관은 인스쿨즈 서비스 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.</p>
                  <p className="mt-2">제2조 (정의)</p>
                  <p>1. &quot;서비스&quot;라 함은 회사가 제공하는 모든 서비스를 의미합니다.</p>
                  <p>2. &quot;회원&quot;이라 함은 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
                  <p className="mt-2">제3조 (약관의 효력 및 변경)</p>
                  <p>1. 이 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</p>
                  <p>2. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 웹사이트에 공지함으로써 효력이 발생합니다.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <FormMessage />
          </div>
          
          {/* 개인정보 처리방침 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
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
                          handleCheckboxChange('privacyAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      <span className="flex items-center">
                        [필수] 개인정보 처리방침 
                        <Shield className="ml-1 h-4 w-4 text-green-500" />
                      </span>
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <Accordion type="single" collapsible className="bg-gray-50 rounded-md px-4">
              <AccordionItem value="privacy" className="border-none">
                <AccordionTrigger className="text-sm text-gray-500 py-2">
                  내용 보기
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 max-h-40 overflow-y-auto border-t pt-2">
                  <p>1. 수집하는 개인정보 항목</p>
                  <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
                  <p>- 필수항목: 이름, 이메일 주소, 비밀번호, 학교 정보, 학년/반/번호</p>
                  <p>- 선택항목: 프로필 이미지, 자기소개, 관심 분야</p>
                  <p className="mt-2">2. 개인정보의 수집 및 이용목적</p>
                  <p>- 서비스 제공 및 회원 관리</p>
                  <p>- 학교 커뮤니티 서비스 제공</p>
                  <p>- 맞춤형 콘텐츠 제공 및 서비스 개선</p>
                  <p className="mt-2">3. 개인정보의 보유 및 이용기간</p>
                  <p>회원 탈퇴 시까지 또는 법령에 따른 보존기간까지</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <FormMessage />
          </div>
          
          {/* 위치기반 서비스 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
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
                          handleCheckboxChange('locationAgreed', checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-medium cursor-pointer">
                      [필수] 위치기반 서비스 이용약관
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            <Accordion type="single" collapsible className="bg-gray-50 rounded-md px-4">
              <AccordionItem value="location" className="border-none">
                <AccordionTrigger className="text-sm text-gray-500 py-2">
                  내용 보기
                </AccordionTrigger>
                <AccordionContent className="text-xs text-gray-600 max-h-40 overflow-y-auto border-t pt-2">
                  <p>1. 위치정보 수집 방법</p>
                  <p>- 회원이 입력한 학교 및 지역 정보</p>
                  <p>- 모바일 앱 사용 시 GPS 정보 (선택적)</p>
                  <p className="mt-2">2. 위치정보 이용 목적</p>
                  <p>- 주변 학교 및 교육 기관 정보 제공</p>
                  <p>- 지역 기반 맞춤형 콘텐츠 제공</p>
                  <p>- 학교 인증 및 확인</p>
                  <p className="mt-2">3. 위치정보 보유기간</p>
                  <p>위치정보는 서비스 제공 목적 달성 시까지 보관되며, 회원 탈퇴 시 즉시 파기됩니다.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <FormMessage />
          </div>
          
          {/* 마케팅 정보 수신 동의 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
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
                          handleCheckboxChange('marketingAgreed', checked as boolean);
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
            <FormDescription className="text-xs ml-7">
              인스쿨즈의 새로운 소식, 이벤트 정보, 맞춤형 콘텐츠 추천 등의 정보를 이메일과 알림으로 받아보실 수 있습니다.
            </FormDescription>
          </div>
        </form>
      </Form>
    </div>
  );
} 