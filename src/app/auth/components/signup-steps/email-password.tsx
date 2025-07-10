'use client';

import { useState } from 'react';
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
import { Eye, EyeOff } from 'lucide-react';

const emailPasswordSchema = z.object({
  email: z.string()
    .email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});

type EmailPasswordValues = z.infer<typeof emailPasswordSchema>;

interface EmailPasswordStepProps {
  formData: {
    email: string;
    password: string;
    passwordConfirm: string;
  };
  updateFormData: (data: Partial<any>) => void;
  onNext: () => void;
}

export function EmailPasswordStep({ formData, updateFormData, onNext }: EmailPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const form = useForm<EmailPasswordValues>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: {
      email: formData.email || '',
      password: formData.password || '',
      passwordConfirm: formData.passwordConfirm || '',
    },
  });

  const handleFieldChange = (field: keyof EmailPasswordValues, value: string) => {
    form.setValue(field, value);
    updateFormData({ [field]: value });
  };

  const onSubmit = (values: EmailPasswordValues) => {
    updateFormData(values);
    onNext();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">기본 정보 입력</h2>
      <p className="text-sm text-gray-600">이메일과 비밀번호를 입력해주세요.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="example@email.com" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('email', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="8자 이상 입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('password', e.target.value);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="비밀번호 재입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('passwordConfirm', e.target.value);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
} 