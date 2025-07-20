'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FileText, Info, Shield, ExternalLink, Eye, MapPin, Mail } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

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

interface FormDataType {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  locationAgreed: boolean;
  marketingAgreed: boolean;
}

interface TermsAgreementStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
}

// 약관 미리보기 내용
const TERMS_PREVIEW = {
  terms: `제1조 (목적)
이 약관은 온마인드랩(사업자등록번호: 166-22-02407)이 운영하는 인스쿨즈(이하 "서비스")의 이용과 관련하여 회사와 이용자간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 온마인드랩이 제공하는 학교 커뮤니티 플랫폼 "인스쿨즈"를 의미합니다.
2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
3. "회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.

제3조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다:
- 학교별 커뮤니티 서비스
- 지역별 커뮤니티 서비스  
- 게시판 및 댓글 서비스
- 학교 인증 서비스
- 경험치 및 랭킹 시스템
- 게임 서비스`,
  
  privacy: `제1조 (개인정보의 처리 목적)
인스쿨즈는 다음의 목적을 위하여 개인정보를 처리합니다:
1. 회원가입 및 관리
2. 학교 커뮤니티 서비스 제공
3. 학교 인증 서비스
4. 마케팅 및 광고에의 활용

제2조 (처리하는 개인정보 항목)
필수항목: 이메일, 비밀번호, 사용자명(아이디), 실명, 성별, 생년월일, 휴대폰번호, 학교정보, 지역정보
선택항목: 프로필이미지, 추천인정보

제3조 (개인정보의 보유기간)
회원가입 및 관리: 서비스 이용계약 또는 회원가입 해지시까지

제4조 (개인정보 보호책임자)
성명: 신선웅 (대표)
연락처: 010-6711-7933, pobredward@gmail.com`,
  
  location: `제1조 (목적)
본 약관은 인스쿨즈에서 제공하는 위치기반서비스에 대해 회사와 개인위치정보주체간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스 내용)
회사는 다음과 같은 위치기반서비스를 제공합니다:
- 지역별 커뮤니티 서비스: 현재 위치 기준 지역 커뮤니티 정보 제공
- 주변 학교 정보 제공: 위치 주변 학교 정보 및 커뮤니티 추천
- 위치 기반 맞춤 콘텐츠: 지역별 특성에 맞는 게시글, 이벤트 정보
- 지역별 랭킹 서비스: 지역 단위 사용자 활동 랭킹

제3조 (개인위치정보의 보유기간)
개인위치정보는 수집한 시점으로부터 1년을 초과하여 보관하지 않습니다.`
};

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
    
    const values = form.getValues();
    const requiredChecked = values.termsAgreed && values.privacyAgreed && values.locationAgreed;
    setAllChecked(requiredChecked && (values.marketingAgreed || false));
  };

  const onSubmit = (values: TermsAgreementValues) => {
    updateFormData(values);
  };

  // 약관 미리보기 컴포넌트
  const TermsPreviewDialog = ({ title, content, icon: Icon }: { title: string, content: string, icon: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Eye className="h-3 w-3 mr-1" />
          미리보기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            약관의 주요 내용을 미리 확인하실 수 있습니다. 전체 내용은 해당 페이지에서 확인해주세요.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96 w-full rounded-md border p-4">
          <pre className="whitespace-pre-wrap text-sm leading-6">{content}</pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-green-600" />
        <h2 className="text-xl font-bold">약관 동의</h2>
      </div>
      
      {/* 중요 안내사항 */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-800">📋 서비스 이용을 위한 필수 약관 동의</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 서비스 이용을 위해 아래 필수 약관에 모두 동의해주세요.</li>
              <li>• 각 약관의 상세 내용은 '미리보기' 또는 '전체보기' 버튼을 통해 확인하실 수 있습니다.</li>
              <li>• 필수 약관에 동의하지 않을 경우 서비스 이용이 제한됩니다.</li>
              <li>• 만 14세 미만은 법정대리인의 동의가 필요합니다.</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 전체 동의 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200">
        <div className="flex items-center gap-4">
          <Checkbox 
            id="all-agree" 
            checked={allChecked}
            onCheckedChange={(checked) => toggleAllAgreements(checked as boolean)}
            className="h-5 w-5"
          />
          <label
            htmlFor="all-agree"
            className="text-lg font-bold cursor-pointer flex-1 text-green-800"
          >
            ✅ 전체 약관에 동의합니다 (필수 + 선택)
          </label>
        </div>
        <p className="text-sm text-green-600 mt-2 ml-9">
          아래 모든 약관을 한 번에 동의하시려면 체크해주세요.
        </p>
      </div>
      
      <Separator className="my-6" />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* 필수 약관들 */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-bold">필수</span>
              반드시 동의해야 하는 약관
            </h3>
            
            {/* 서비스 이용약관 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
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
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold cursor-pointer text-base">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          [필수] 서비스 이용약관
                        </span>
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <TermsPreviewDialog 
                    title="서비스 이용약관" 
                    content={TERMS_PREVIEW.terms} 
                    icon={FileText}
                  />
                  <Link href="/terms" target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      전체보기
                    </Button>
                  </Link>
                </div>
              </div>
              <FormDescription className="text-xs text-gray-600 ml-7">
                서비스 이용 규칙, 회원의 권리와 의무, 서비스 제공 범위 등에 대한 기본 약관입니다.
              </FormDescription>
            </div>

            {/* 개인정보 처리방침 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
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
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold cursor-pointer text-base">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          [필수] 개인정보 처리방침
                        </span>
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <TermsPreviewDialog 
                    title="개인정보 처리방침" 
                    content={TERMS_PREVIEW.privacy} 
                    icon={Shield}
                  />
                  <Link href="/privacy" target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      전체보기
                    </Button>
                  </Link>
                </div>
              </div>
              <FormDescription className="text-xs text-gray-600 ml-7">
                개인정보 수집·이용 목적, 수집 항목, 보유기간, 제3자 제공 등에 대한 처리방침입니다.
              </FormDescription>
            </div>

            {/* 위치기반 서비스 이용약관 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
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
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold cursor-pointer text-base">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          [필수] 위치기반 서비스 이용약관
                        </span>
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <TermsPreviewDialog 
                    title="위치기반 서비스 이용약관" 
                    content={TERMS_PREVIEW.location} 
                    icon={MapPin}
                  />
                  <Link href="/location-terms" target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      전체보기
                    </Button>
                  </Link>
                </div>
              </div>
              <FormDescription className="text-xs text-gray-600 ml-7">
                지역별 커뮤니티, 주변 학교 정보 등 위치 기반 서비스 제공을 위한 약관입니다.
              </FormDescription>
            </div>
          </div>

          <Separator />

          {/* 선택 약관 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-bold">선택</span>
              선택적으로 동의하는 약관
            </h3>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
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
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="font-semibold cursor-pointer text-base">
                        <span className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-purple-600" />
                          [선택] 마케팅 정보 수신 동의
                        </span>
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription className="text-xs text-gray-600 ml-7">
                새로운 소식, 이벤트 정보, 맞춤형 콘텐츠 추천 등을 이메일과 알림으로 받아보실 수 있습니다. 
                언제든지 설정에서 변경 가능합니다.
              </FormDescription>
            </div>
          </div>

          {/* 약관 관련 추가 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <h4 className="font-semibold mb-2">📌 약관 관련 안내사항</h4>
            <ul className="space-y-1 text-xs">
              <li>• 약관은 서비스 개선을 위해 변경될 수 있으며, 변경 시 7일 전 공지됩니다.</li>
              <li>• 개인정보 처리방침은 개인정보보호법에 따라 작성되었습니다.</li>
              <li>• 위치정보는 서비스 제공 목적으로만 사용되며, 1년 후 자동 삭제됩니다.</li>
              <li>• 마케팅 수신 동의는 언제든지 철회할 수 있습니다.</li>
              <li>• 문의사항: 010-6711-7933, pobredward@gmail.com</li>
            </ul>
          </div>
        </form>
      </Form>
    </div>
  );
} 