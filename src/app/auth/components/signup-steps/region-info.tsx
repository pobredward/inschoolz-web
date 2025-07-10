'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { SignupStepProps } from '@/types';
import { getAllRegions, getDistrictsByRegion } from '@/lib/api/schools';

const regionInfoSchema = z.object({
  province: z.string().min(1, { message: '시/도를 선택해주세요.' }),
  city: z.string().min(1, { message: '시/군/구를 선택해주세요.' }),
});

type RegionInfoValues = z.infer<typeof regionInfoSchema>;

type RegionInfoStepProps = SignupStepProps;

export function RegionInfoStep({ formData, updateFormData }: RegionInfoStepProps) {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegionInfoValues>({
    resolver: zodResolver(regionInfoSchema),
    defaultValues: {
      province: formData.regions?.sido || '',
      city: formData.regions?.sigungu || '',
    },
  });

  const watchProvince = form.watch('province');

  // 시/도 목록 불러오기
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoading(true);
      try {
        const regions = await getAllRegions();
        setProvinces(regions);
      } catch (error) {
        console.error('시/도 목록 불러오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // 시/군/구 목록 불러오기
  useEffect(() => {
    const fetchCities = async () => {
      if (!watchProvince) {
        setCities([]);
        return;
      }

      setIsLoading(true);
      try {
        const districts = await getDistrictsByRegion(watchProvince);
        setCities(districts);
      } catch (error) {
        console.error('시/군/구 목록 불러오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, [watchProvince]);

  const handleFieldChange = (field: 'province' | 'city', value: string) => {
    form.setValue(field, value);
    
    // regions 구조로 저장하도록 수정
    const currentRegions = formData.regions || { sido: '', sigungu: '', address: '' };
    
    if (field === 'province') {
      updateFormData({ 
        regions: {
          ...currentRegions,
          sido: value,
          sigungu: '' // 시/도 변경 시 시/군/구 초기화
        }
      });
      form.setValue('city', '');
    } else if (field === 'city') {
      updateFormData({ 
        regions: {
          ...currentRegions,
          sigungu: value
        }
      });
    }
  };

  const onSubmit = (values: RegionInfoValues) => {
    // regions 구조로 업데이트
    updateFormData({
      regions: {
        sido: values.province,
        sigungu: values.city,
        address: formData.regions?.address || ''
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">지역 정보</h2>
      <p className="text-muted-foreground">
        지역 정보는 지역 게시판 접근 권한 및 학교 검증에 사용됩니다.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시/도</FormLabel>
                <Select 
                  value={field.value}
                  onValueChange={(value) => handleFieldChange('province', value)}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="시/도 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시/군/구</FormLabel>
                <Select 
                  value={field.value}
                  onValueChange={(value) => handleFieldChange('city', value)}
                  disabled={!watchProvince || isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={watchProvince ? "시/군/구 선택" : "시/도를 먼저 선택해주세요"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
} 