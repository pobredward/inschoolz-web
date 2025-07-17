'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Timestamp } from 'firebase/firestore'

export interface PollOption {
  id: string
  text: string
}

export interface PollData {
  question: string
  options: PollOption[]
}

interface PollEditorProps {
  pollData: PollData
  onChange: (data: PollData) => void
}

export default function PollEditor({ pollData, onChange }: PollEditorProps) {
  // 새 옵션 추가
  const handleAddOption = () => {
    const newOption: PollOption = {
      id: `option-${Date.now()}`,
      text: ''
    }
    
    onChange({
      ...pollData,
      options: [...pollData.options, newOption]
    })
  }
  
  // 옵션 제거
  const handleRemoveOption = (id: string) => {
    onChange({
      ...pollData,
      options: pollData.options.filter(option => option.id !== id)
    })
  }
  
  // 질문 변경
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...pollData,
      question: e.target.value
    })
  }
  
  // 옵션 텍스트 변경
  const handleOptionChange = (id: string, text: string) => {
    onChange({
      ...pollData,
      options: pollData.options.map(option => 
        option.id === id ? { ...option, text } : option
      )
    })
  }
  
  return (
    <Card className="shadow-sm border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">투표 만들기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poll-question">투표 질문</Label>
          <Input
            id="poll-question"
            value={pollData.question}
            onChange={handleQuestionChange}
            placeholder="투표 질문을 입력하세요"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>선택지</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="h-8"
              disabled={pollData.options.length >= 10}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>선택지 추가</span>
            </Button>
          </div>
          
          {pollData.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`선택지 ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(option.id)}
                disabled={pollData.options.length <= 2}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          
          {pollData.options.length < 2 && (
            <p className="text-xs text-muted-foreground">최소 2개의 선택지가 필요합니다.</p>
          )}
          {pollData.options.length >= 10 && (
            <p className="text-xs text-muted-foreground">최대 10개의 선택지만 등록 가능합니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 