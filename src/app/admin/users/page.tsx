"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  RefreshCw
} from 'lucide-react';
import { 
  getUsersList, 
  updateUserRole, 
  updateUserStatus, 
  updateUserExperienceAdmin, 
  addUserWarning, 
  deleteUser, 
  bulkUpdateUsers,
  AdminUserListParams,
} from '@/lib/api/users';
import { User, FirebaseTimestamp } from '@/types'; // 통일된 타입 사용
import { toast } from 'sonner';
import { toDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastActiveAt' | 'totalExperience' | 'userName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 다이얼로그 상태
  const [warningDialog, setWarningDialog] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  const [experienceDialog, setExperienceDialog] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
  
  // 폼 상태
  const [warningForm, setWarningForm] = useState({ reason: '', severity: 'medium' as 'low' | 'medium' | 'high' });
  const [experienceForm, setExperienceForm] = useState({ totalExperience: 0, reason: '' });
  const [bulkAction, setBulkAction] = useState<{ type: string; value: string }>({ type: '', value: '' });

  const loadUsers = async (params: AdminUserListParams = {}) => {
    setIsLoading(true);
    try {
      const response = await getUsersList({
        page: currentPage,
        pageSize: 20,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
        ...params
      });
      
      setUsers(response.users);
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      toast.error('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers({ page: 1 });
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.uid));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('사용자 역할이 변경되었습니다.');
      loadUsers();
    } catch (error) {
      toast.error('역할 변경 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await updateUserStatus(userId, newStatus);
      toast.success('사용자 상태가 변경되었습니다.');
      loadUsers();
    } catch (error) {
      toast.error('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleAddWarning = async () => {
    if (!warningDialog.user) return;
    
    try {
      await addUserWarning(warningDialog.user.uid, warningForm.reason, warningForm.severity);
      toast.success('경고가 추가되었습니다.');
      setWarningDialog({ isOpen: false, user: null });
      setWarningForm({ reason: '', severity: 'medium' });
      loadUsers();
    } catch (error) {
      toast.error('경고 추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateExperience = async () => {
    if (!experienceDialog.user) return;
    
    try {
              await updateUserExperienceAdmin(experienceDialog.user.uid, experienceForm.totalExperience, experienceForm.reason);
      toast.success('경험치가 수정되었습니다.');
      setExperienceDialog({ isOpen: false, user: null });
      setExperienceForm({ totalExperience: 0, reason: '' });
      loadUsers();
    } catch (error) {
      toast.error('경험치 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success('사용자가 삭제되었습니다.');
      loadUsers();
    } catch (error) {
      toast.error('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction.type) return;
    
    try {
      const updates: any = {};
      
      if (bulkAction.type === 'role') {
        updates.role = bulkAction.value;
      } else if (bulkAction.type === 'status') {
        updates.status = bulkAction.value;
      }
      
      await bulkUpdateUsers(selectedUsers, updates);
      toast.success(`${selectedUsers.length}명의 사용자가 업데이트되었습니다.`);
      setSelectedUsers([]);
      setBulkAction({ type: '', value: '' });
      loadUsers();
    } catch (error) {
      toast.error('대량 업데이트 중 오류가 발생했습니다.');
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp?: FirebaseTimestamp | { seconds?: number; nanoseconds?: number } | any) => {
    if (!timestamp) return '-';
    try {
      const date = toDate(timestamp);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="text-gray-600">총 {totalCount}명의 사용자</p>
        </div>
        <Button onClick={() => loadUsers()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">검색</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="사용자명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="role">역할</Label>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="user">일반 사용자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">상태</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sort">정렬</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">가입일 (최신순)</SelectItem>
                  <SelectItem value="createdAt-asc">가입일 (오래된순)</SelectItem>
                  <SelectItem value="lastActiveAt-desc">최근 활동 (최신순)</SelectItem>
                  <SelectItem value="experience-desc">경험치 (높은순)</SelectItem>
                  <SelectItem value="userName-asc">사용자명 (가나다순)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 대량 작업 */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>대량 작업 ({selectedUsers.length}명 선택됨)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={bulkAction.type} onValueChange={(value) => setBulkAction({ ...bulkAction, type: value })}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="작업 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">역할 변경</SelectItem>
                  <SelectItem value="status">상태 변경</SelectItem>
                </SelectContent>
              </Select>
              
              {bulkAction.type === 'role' && (
                <Select value={bulkAction.value} onValueChange={(value) => setBulkAction({ ...bulkAction, value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="역할 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">관리자</SelectItem>
                    <SelectItem value="user">일반 사용자</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              {bulkAction.type === 'status' && (
                <Select value={bulkAction.value} onValueChange={(value) => setBulkAction({ ...bulkAction, value })}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Button onClick={handleBulkAction} disabled={!bulkAction.type || !bulkAction.value}>
                적용
              </Button>
              
              <Button variant="outline" onClick={() => setSelectedUsers([])}>
                선택 해제
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>사용자</TableHead>
                    <TableHead>학교</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>레벨/경험치</TableHead>
                    <TableHead>경고</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.uid)}
                          onCheckedChange={(checked) => handleUserSelect(user.uid, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.profile?.userName || user.email}</div>
                            <div className="text-sm text-gray-500">{user.profile?.realName || '-'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.school?.name || '-'}</TableCell>
                      <TableCell>
                        {user.regions ? `${user.regions.sido || ''} ${user.regions.sigungu || ''}`.trim() || '-' : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role === 'admin' ? '관리자' : user.role === 'student' ? '학생' : user.role === 'teacher' ? '교사' : '일반 사용자'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? '활성' : user.status === 'inactive' ? '비활성' : user.status === 'suspended' ? '정지' : '알 수 없음'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Lv.{user.stats?.level || 1}</div>
                          <div className="text-gray-500">{user.stats?.totalExperience || 0} XP</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${(user.warnings?.count || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {user.warnings?.count || 0}건
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(user.profile?.createdAt || user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(value) => handleRoleChange(user.uid, value as any)}>
                            <SelectTrigger className="w-28 h-8">
                              <span className="text-xs">
                                {user.role === 'admin' ? '관리자' : '일반 사용자'}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">관리자</SelectItem>
                              <SelectItem value="user">일반 사용자</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select onValueChange={(value) => handleStatusChange(user.uid, value as any)}>
                            <SelectTrigger className="w-20 h-8">
                              <span className="text-xs">
                                {user.status === 'active' ? '활성' : user.status === 'inactive' ? '비활성' : user.status === 'suspended' ? '정지' : '활성'}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">활성</SelectItem>
                              <SelectItem value="inactive">비활성</SelectItem>
                              <SelectItem value="suspended">정지</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setWarningDialog({ isOpen: true, user });
                            }}
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExperienceDialog({ isOpen: true, user });
                              setExperienceForm({ totalExperience: user.stats?.totalExperience || 0, reason: '' });
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.uid)}>
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 페이지네이션 */}
              <div className="flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {Math.ceil(totalCount / 20)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!hasMore}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 경고 추가 다이얼로그 */}
      <Dialog open={warningDialog.isOpen} onOpenChange={(open) => setWarningDialog({ isOpen: open, user: warningDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>경고 추가</DialogTitle>
            <DialogDescription>
              사용자 "{warningDialog.user?.profile.userName}"에게 경고를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="warning-reason">경고 사유</Label>
              <Textarea
                id="warning-reason"
                placeholder="경고 사유를 입력하세요..."
                value={warningForm.reason}
                onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="warning-severity">심각도</Label>
              <Select value={warningForm.severity} onValueChange={(value: any) => setWarningForm({ ...warningForm, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">낮음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialog({ isOpen: false, user: null })}>
              취소
            </Button>
            <Button onClick={handleAddWarning}>
              경고 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 경험치 수정 다이얼로그 */}
      <Dialog open={experienceDialog.isOpen} onOpenChange={(open) => setExperienceDialog({ isOpen: open, user: experienceDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>경험치 수정</DialogTitle>
            <DialogDescription>
              사용자 "{experienceDialog.user?.profile.userName}"의 경험치를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="experience-amount">경험치</Label>
              <Input
                id="experience-amount"
                type="number"
                                      value={experienceForm.totalExperience}
                      onChange={(e) => setExperienceForm({ ...experienceForm, totalExperience: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="experience-reason">수정 사유</Label>
              <Textarea
                id="experience-reason"
                placeholder="경험치 수정 사유를 입력하세요..."
                value={experienceForm.reason}
                onChange={(e) => setExperienceForm({ ...experienceForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExperienceDialog({ isOpen: false, user: null })}>
              취소
            </Button>
            <Button onClick={handleUpdateExperience}>
              경험치 수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 