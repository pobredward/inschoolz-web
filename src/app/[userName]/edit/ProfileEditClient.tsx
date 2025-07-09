'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types";
import { toast } from "sonner";
import { updateUserProfile, updateProfileImage } from '@/lib/api/users';
import { useAuth } from "@/providers/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2, ArrowLeft } from 'lucide-react';

interface ProfileEditClientProps {
  userData: User;
}

export default function ProfileEditClient({ userData }: ProfileEditClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    userName: userData.profile?.userName || '',
    realName: userData.profile?.realName || '',
    birthYear: userData.profile?.birthYear?.toString() || '',
    birthMonth: userData.profile?.birthMonth?.toString() || '',
    birthDay: userData.profile?.birthDay?.toString() || '',
    gender: userData.profile?.gender || '',
    phoneNumber: userData.profile?.phoneNumber || '',
    profileImageUrl: userData.profile?.profileImageUrl || '',
  });

  // 폼 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Select 컴포넌트 값 변경 핸들러
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 파일 업로드 버튼 클릭 핸들러
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    router.back();
  };

  // 파일 변경 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 이미지 업로드 처리
    setUploadingImage(true);
    try {
      const result = await updateProfileImage(user.uid, file);
      if (result.success && result.url) {
        setFormData(prev => ({ 
          ...prev, 
          profileImageUrl: result.url || prev.profileImageUrl 
        }));
        toast.success('프로필 이미지가 업데이트되었습니다.');
      } else {
        toast.error(result.error || '이미지 업로드에 실패했습니다.');
        // 미리보기 제거
        setImagePreview(null);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
      // 미리보기 제거
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 프로필 저장 함수
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 유효성 검사
      if (!formData.userName) {
        toast.error('사용자 이름은 필수입니다.');
        setLoading(false);
        return;
      }

      // 생년월일 숫자 변환
      const birthYear = formData.birthYear ? parseInt(formData.birthYear) : undefined;
      const birthMonth = formData.birthMonth ? parseInt(formData.birthMonth) : undefined;
      const birthDay = formData.birthDay ? parseInt(formData.birthDay) : undefined;

      // 프로필 업데이트
      await updateUserProfile(user.uid, {
        userName: formData.userName,
        realName: formData.realName || undefined,
        birthYear,
        birthMonth, 
        birthDay,
        gender: formData.gender || undefined,
        phoneNumber: formData.phoneNumber || undefined,
      });
      
      toast.success('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">프로필 수정</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>프로필 기본 정보를 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="w-32 h-32 mb-3">
                  <AvatarImage 
                    src={imagePreview || formData.profileImageUrl} 
                    alt={formData.userName} 
                  />
                  <AvatarFallback>{formData.userName?.substring(0, 2) || 'ME'}</AvatarFallback>
                </Avatar>
                
                <button
                  type="button"
                  onClick={handleUploadButtonClick}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadButtonClick}
                disabled={uploadingImage}
                className="mt-2"
              >
                {uploadingImage ? '업로드 중...' : '이미지 변경'}
              </Button>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">사용자 이름 <span className="text-red-500">*</span></Label>
                  <Input
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder="사용자 이름을 입력하세요"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="realName">실명</Label>
                  <Input
                    id="realName"
                    name="realName"
                    value={formData.realName}
                    onChange={handleChange}
                    placeholder="실명을 입력하세요 (선택사항)"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>성별</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleSelectChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">연락처</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="연락처를 입력하세요"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>생년월일</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="년도"
                  type="number"
                />
                <Input
                  name="birthMonth"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  placeholder="월"
                  type="number"
                  min="1"
                  max="12"
                />
                <Input
                  name="birthDay"
                  value={formData.birthDay}
                  onChange={handleChange}
                  placeholder="일"
                  type="number"
                  min="1"
                  max="31"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={handleGoBack}
        >
          취소
        </Button>
        <Button 
          onClick={handleSaveProfile}
          disabled={loading}
        >
          {loading ? '저장 중...' : '저장하기'}
        </Button>
      </div>
    </div>
  );
} 