import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { TranslationService } from '../i18n/translation.service';

interface ArabicTaskText {
  title: string;
  description: string;
}

interface MockUser {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface MockTask {
  id: string;
  title: string;
  description: string;
  assignee: MockUser;
  translations?: {
    en: ArabicTaskText;
    ar: ArabicTaskText;
  };
  [key: string]: unknown;
}

interface MockStatistic {
  id: string;
  [key: string]: unknown;
}

interface MockActivity {
  taskId: string;
  taskTitle: string;
  actor: MockUser;
  taskTranslations?: MockTask['translations'];
  [key: string]: unknown;
}

const TASKS: Record<string, ArabicTaskText> = {
  'task-001': {
    title: 'تصميم تخطيط جديد للصفحة الرئيسية',
    description: 'إنشاء مخططات ونماذج أولية لإعادة تصميم الصفحة الرئيسية بعناصر حديثة',
  },
  'task-002': {
    title: 'تحديث التوثيق',
    description: 'مراجعة وتحديث توثيق واجهة API للإصدار 2.0',
  },
  'task-003': {
    title: 'تنظيم اجتماع الفريق',
    description: 'جدولة وإعداد جدول أعمال جلسة التخطيط ربع السنوية',
  },
  'task-004': {
    title: 'إصلاح مشكلات التصميم المتجاوب',
    description: 'معالجة مشكلات التخطيط على الهواتف والأجهزة اللوحية',
  },
  'task-005': {
    title: 'تنفيذ مصادقة المستخدم',
    description: 'إضافة نظام مصادقة يعتمد على JWT مع رموز تحديث',
  },
  'task-006': {
    title: 'تحسين استعلامات قاعدة البيانات',
    description: 'مراجعة وتحسين الاستعلامات البطيئة التي كشفها تدقيق الأداء',
  },
  'task-007': {
    title: 'إنشاء نقاط نهاية API',
    description: 'تطوير نقاط نهاية RESTful لميزات إدارة المهام',
  },
  'task-008': {
    title: 'إضافة الوضع الداكن',
    description: 'تنفيذ التبديل بين الوضعين الداكن والفاتح',
  },
  'task-009': {
    title: 'إصلاح خطأ تسجيل الدخول الحرج',
    description: 'حل المشكلة التي كانت تمنع المستخدمين من تسجيل الدخول عبر الهاتف',
  },
  'task-010': {
    title: 'إعداد مسار CI/CD',
    description: 'إعداد GitHub Actions للاختبار والنشر الآلي',
  },
  'task-011': {
    title: 'كتابة اختبارات الوحدة',
    description: 'إضافة اختبارات وحدة شاملة لوحدة المصادقة',
  },
  'task-012': {
    title: 'إعادة هيكلة وحدة الدفع',
    description: 'تنظيف وتحسين كود معالجة المدفوعات',
  },
  'task-013': {
    title: 'تدقيق الأمان',
    description: 'إجراء مراجعة أمنية شاملة للتطبيق',
  },
  'task-014': {
    title: 'تحديث الاعتماديات',
    description: 'تحديث جميع حزم npm إلى أحدث الإصدارات المستقرة',
  },
  'task-015': {
    title: 'إعداد تقرير ميزانية الربع الرابع',
    description: 'تجميع وتحليل البيانات المالية لعرض الميزانية ربع السنوي',
  },
  'task-016': {
    title: 'مراجعة ملاحظات العملاء',
    description: 'تحليل ملاحظات العملاء من جلسات اختبار المستخدمين',
  },
  'task-017': {
    title: 'تحديث تكامل بوابة الدفع',
    description: 'الانتقال إلى واجهة مزود الدفع الجديدة وتحديث منطق الفوترة',
  },
};

const USERS: Record<string, string> = {
  'user-001': 'جون دو',
  'user-002': 'سارة سميث',
  'user-003': 'مايك جونسون',
  'user-004': 'إيميلي ديفيس',
};

const STATISTICS: Record<string, { title: string; changeLabel: string }> = {
  'stat-001': { title: 'إجمالي المهام', changeLabel: 'هذا الأسبوع' },
  'stat-002': { title: 'المكتملة', changeLabel: 'اليوم' },
  'stat-003': { title: 'قيد التنفيذ', changeLabel: 'مثل الأمس' },
  'stat-004': { title: 'المتأخرة', changeLabel: 'اليوم' },
};

/**
 * JSON Server cannot negotiate localized responses. This adapter makes the bundled mock API
 * honour Accept-Language. A production backend should return these localized fields itself.
 */
export const mockLocalizationInterceptor: HttpInterceptorFn = (request, next) => {
  const language = inject(TranslationService).language();

  if (language !== 'ar' || request.method !== 'GET') {
    return next(request);
  }

  return next(request).pipe(
    map((event) =>
      event instanceof HttpResponse
        ? event.clone({ body: localizeResponse(request.url, event.body) })
        : event,
    ),
  );
};

function localizeResponse(url: string, body: unknown): unknown {
  if (!Array.isArray(body)) {
    return body;
  }

  if (url.endsWith('/tasks')) {
    return (body as MockTask[]).map(localizeTask);
  }

  if (url.endsWith('/users')) {
    return (body as MockUser[]).map(localizeUser);
  }

  if (url.endsWith('/statistics')) {
    return (body as MockStatistic[]).map((statistic) => ({
      ...statistic,
      ...(STATISTICS[statistic.id] ?? {}),
    }));
  }

  if (url.endsWith('/activities')) {
    return (body as MockActivity[]).map((activity) => ({
      ...activity,
      taskTitle:
        activity.taskTranslations?.ar.title ?? TASKS[activity.taskId]?.title ?? activity.taskTitle,
      actor: localizeUser(activity.actor),
    }));
  }

  return body;
}

function localizeTask(task: MockTask): MockTask {
  const arabic = task.translations?.ar ?? TASKS[task.id];

  if (!arabic) {
    return { ...task, assignee: localizeUser(task.assignee) };
  }

  return {
    ...task,
    ...arabic,
    translations: {
      en: task.translations?.en ?? { title: task.title, description: task.description },
      ar: arabic,
    },
    assignee: localizeUser(task.assignee),
  };
}

function localizeUser(user: MockUser): MockUser {
  return { ...user, name: USERS[user.id] ?? user.name };
}
