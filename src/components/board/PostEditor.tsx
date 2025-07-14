"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlusCircle, X, BarChart, Image, ChevronLeft } from "lucide-react";
import { BoardType, PostFormData } from "@/types/board";
import { createPost } from "@/lib/api/board";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface PostEditorProps {
  boardCode: string;
  boardType: BoardType;
  board: {
    allowAnonymous: boolean;
    allowPolls: boolean;
    id: string;
    name: string;
    description: string;
  };
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
}

// 폼 스키마 정의
const formSchema = z.object({
  title: z.string().min(2, "제목은 2자 이상이어야 합니다").max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(5, "내용은 5자 이상이어야 합니다"),
  isAnonymous: z.boolean(),
  tags: z.array(z.string()).max(5, "태그는 최대 5개까지 추가할 수 있습니다"),
  poll: z.object({
    isActive: z.boolean(),
    question: z.string().optional(),
    options: z.array(z.object({
      text: z.string().min(1, "옵션 텍스트를 입력하세요"),
      imageUrl: z.string().optional(),
    })).min(2, "최소 2개의 옵션이 필요합니다").optional(),
    expiresAt: z.date().optional(),
    multipleChoice: z.boolean(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PostEditor({ boardCode, boardType, board, schoolId, regions }: PostEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [isPollActive, setIsPollActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollOptions, setPollOptions] = useState<{ text: string; imageUrl?: string }[]>([{ text: "" }, { text: "" }]);

  // 폼 초기화
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      isAnonymous: false,
      tags: [],
      poll: {
        isActive: false,
        multipleChoice: false
      }
    },
  });
  
  // 폼 제출 핸들러
  const onSubmit = async (values: FormValues) => {
    try {
      if (!user) {
        toast({
          title: "로그인이 필요합니다",
          description: "게시글을 작성하려면 로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // 투표 정보 추가
      let pollData = undefined;
      
      if (isPollActive && values.poll?.question && pollOptions.length >= 2) {
        // 빈 옵션 필터링
        const validOptions = pollOptions.filter(option => option.text.trim() !== "");
        
        if (validOptions.length >= 2) {
          pollData = {
            question: values.poll.question,
            options: validOptions,
            expiresAt: values.poll.expiresAt,
            multipleChoice: values.poll.multipleChoice || false
          };
        }
      }
      
      const postData: PostFormData = {
        title: values.title,
        content: values.content,
        isAnonymous: values.isAnonymous,
        tags: values.tags,
        poll: pollData
      };
      
      // 실제 저장 함수 호출
      const postId = await createPost(boardCode, boardType, postData, user.uid);
      
      toast({
        title: "게시글 작성 완료",
        description: "게시글이 성공적으로 작성되었습니다.",
      });
      
      // 작성된 게시글로 이동
      let postUrl = '';
      
      switch (boardType) {
        case 'national':
          postUrl = `/community/national/${boardCode}/${postId}`;
          break;
        case 'regional':
          // props로 받은 지역 정보 우선 사용, 없으면 사용자의 지역 정보 사용
          const targetSido = regions?.sido || user?.regions?.sido;
          const targetSigungu = regions?.sigungu || user?.regions?.sigungu;
          if (targetSido && targetSigungu) {
            postUrl = `/community/region/${encodeURIComponent(targetSido)}/${encodeURIComponent(targetSigungu)}/${boardCode}/${postId}`;
          }
          break;
        case 'school':
          // props로 받은 schoolId 우선 사용, 없으면 사용자의 학교 ID 사용
          const targetSchoolId = schoolId || user?.school?.id;
          if (targetSchoolId) {
            postUrl = `/community/school/${targetSchoolId}/${boardCode}/${postId}`;
          }
          break;
      }
      
      if (postUrl) {
        router.push(postUrl);
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error);
      toast({
        title: "게시글 작성 실패",
        description: "게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 태그 추가
  const addTag = () => {
    const tag = tagInput.trim();
    
    if (tag && !form.getValues().tags.includes(tag) && form.getValues().tags.length < 5) {
      form.setValue("tags", [...form.getValues().tags, tag]);
      setTagInput("");
    }
  };
  
  // 태그 삭제
  const removeTag = (tag: string) => {
    form.setValue("tags", form.getValues().tags.filter(t => t !== tag));
  };
  
  // Enter 키로 태그 추가
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };
  
  // 투표 옵션 추가
  const addPollOption = () => {
    setPollOptions([...pollOptions, { text: "" }]);
  };
  
  // 투표 옵션 변경
  const updatePollOption = (index: number, text: string) => {
    const newOptions = [...pollOptions];
    newOptions[index].text = text;
    setPollOptions(newOptions);
  };
  
  // 투표 옵션 삭제
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  // 사용자가 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">로그인이 필요합니다</h2>
        <p className="text-muted-foreground mb-6">게시글을 작성하려면 먼저 로그인해주세요.</p>
        <Button onClick={() => router.push('/login')}>로그인하기</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input 
                  placeholder="제목을 입력하세요" 
                  {...field} 
                  className="text-lg py-6"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>내용</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="내용을 입력하세요" 
                  {...field} 
                  className="min-h-[300px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-6">
          <div>
            <FormLabel>태그</FormLabel>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="태그를 입력하세요"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                maxLength={20}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addTag}
                disabled={form.getValues().tags.length >= 5}
              >
                추가
              </Button>
            </div>
            <FormDescription>
              최대 5개까지 추가할 수 있습니다.
            </FormDescription>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {form.getValues().tags.map(tag => (
                <Badge key={tag} variant="secondary" className="px-2 py-1">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-2 text-muted-foreground" 
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {board.allowPolls && (
            <>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="poll">
                  <AccordionTrigger className="text-base">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      <span>투표 추가하기</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="poll.isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch
                                checked={isPollActive}
                                onCheckedChange={(checked) => {
                                  setIsPollActive(checked);
                                  field.onChange(checked);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer">투표 활성화</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {isPollActive && (
                      <Card>
                        <CardContent className="pt-6 space-y-4">
                          <FormField
                            control={form.control}
                            name="poll.question"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>질문</FormLabel>
                                <FormControl>
                                  <Input placeholder="투표 질문을 입력하세요" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-2">
                            <FormLabel>선택 옵션</FormLabel>
                            {pollOptions.map((option, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <Input
                                  placeholder={`옵션 ${index + 1}`}
                                  value={option.text}
                                  onChange={(e) => updatePollOption(index, e.target.value)}
                                />
                                {index >= 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePollOption(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={addPollOption}
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              옵션 추가하기
                            </Button>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="poll.multipleChoice"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer">
                                  복수 선택 허용
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <Separator />
            </>
          )}
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="images">
              <AccordionTrigger className="text-base">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <span>이미지 첨부하기</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="border-2 border-dashed rounded-md p-8 text-center">
                  <p className="text-muted-foreground">
                    이미지를 드래그하여 업로드하거나 파일을 선택하세요
                  </p>
                  <Button variant="outline" className="mt-4">
                    파일 선택
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Separator />
          
          {board.allowAnonymous && (
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    익명으로 작성
                  </FormLabel>
                  <FormDescription>
                    익명으로 작성 시 사용자 정보가 표시되지 않습니다.
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "게시하기"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 