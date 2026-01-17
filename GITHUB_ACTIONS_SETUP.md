# GitHub Actions - הגדרת עדכון אוטומטי יומי

## מה זה עושה?

GitHub Actions מריץ את הסקריפט `run_daily_job.js` **אוטומטית כל בוקר בשעה 8:00** (שעון ישראל).

הסקריפט:
1. שולף כתבות טרנדיות מ-Reddit
2. מעבד אותן עם AI (Google Gemini)
3. שומר את התוצאות ל-Firebase
4. מעדכן את הקובץ `public/data.js`
5. עושה commit אוטומטי ל-GitHub

---

## שלבי ההגדרה הראשונית

### שלב 1: הוסף Secrets ל-GitHub Repository

עבור ל-Settings → Secrets and variables → Actions → New repository secret

צור את ה-Secrets הבאים:

#### 1. `GOOGLE_API_KEY`
```
***REDACTED***
```

#### 2. `APIFY_TOKEN`
```
***REDACTED***
```

#### 3. `FIREBASE_CREDENTIALS`
העתק את **כל התוכן** של הקובץ `serviceAccountKey.json`:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  ...
}
```

⚠️ **חשוב**: העתק את כל הקובץ JSON כולל הסוגריים

---

### שלב 2: הפעל את GitHub Actions

1. לך ל-**Actions** בעמוד הראשי של ה-repository
2. אשר שאתה רוצה להפעיל workflows (אם זו הפעם הראשונה)
3. תראה את ה-workflow **"Daily Reddit Scraper"**

---

### שלב 3: הרץ ידנית (בדיקה)

1. עבור ל-Actions → Daily Reddit Scraper
2. לחץ על **"Run workflow"** → **"Run workflow"**
3. המתן כ-5 דקות
4. ודא שה-workflow הסתיים בהצלחה (סימן ✓ ירוק)
5. בדוק שהקובץ `public/data.js` התעדכן עם commit חדש

---

## זמני הרצה

### רצוי אוטומטי
- **כל יום בשעה 8:00 בבוקר** (שעון ישראל)
- רק אם יש שינויים, יתבצע commit אוטומטי

### הרצה ידנית
אפשר להריץ בכל זמן:
1. Actions → Daily Reddit Scraper
2. Run workflow → Run workflow

---

## מבנה ה-Workflow

הקובץ: `.github/workflows/daily-scraper.yml`

```yaml
1. Checkout code - מוריד את הקוד מ-GitHub
2. Setup Node.js - מתקין Node.js 18
3. Install dependencies - מריץ npm ci
4. Create Firebase credentials - יוצר את קובץ ה-credentials מה-secret
5. Run daily scraper job - מריץ את run_daily_job.js
6. Commit and push updated data - עושה commit אוטומטי של data.js
7. Cleanup credentials - מוחק את קובץ ה-credentials (אבטחה)
```

---

## איך לוודא שזה עובד?

### בדיקה 1: Actions Tab
- עבור ל-**Actions** ב-GitHub
- תראה את ההרצות האחרונות
- ✓ ירוק = הצלחה
- ✗ אדום = שגיאה

### בדיקה 2: Commits
- עבור ל-**Commits**
- תראה commits אוטומטיים עם ההודעה:
  ```
  🤖 Auto-update: Daily Reddit trends data (2026-01-17 08:00)
  ```

### בדיקה 3: קובץ הנתונים
- בדוק את `public/data.js`
- ודא שהתאריך בכתבות עדכני (לא יותר מ-48 שעות)

---

## פתרון בעיות

### שגיאה: "secrets not found"
➜ ודא שהוספת את כל 3 ה-Secrets ב-Settings → Secrets and variables → Actions

### שגיאה: "Firebase authentication failed"
➜ ודא ש-`FIREBASE_CREDENTIALS` מכיל את כל תוכן ה-JSON של serviceAccountKey.json

### שגיאה: "Google API quota exceeded"
➜ בדוק את ה-quota ב-Google Cloud Console
➜ אפשר להוסיף billing או להמתין ל-reset (בדרך כלל יומי)

### לא רואה את ה-workflow ב-Actions
➜ ודא שעשית push של התיקייה `.github/workflows/` ל-GitHub
➜ ודא שאישרת הפעלת Actions בעמוד Actions

### ה-workflow רץ אבל לא עושה commit
➜ ככל הנראה לא היו כתבות חדשות או ששגיאה קרתה
➜ בדוק את ה-logs של ה-workflow

---

## יתרונות המעבר ל-GitHub Actions

✅ **עובד 24/7** - לא תלוי במחשב שלך
✅ **חינמי לחלוטין** - 2,000 דקות חינם לחודש
✅ **אוטומטי** - אין צורך לזכור להריץ
✅ **מתועד** - כל הרצה נרשמת ב-Actions
✅ **גיבוי אוטומטי** - הכל ב-Git commits

---

## הערות חשובות

🔐 **אבטחה**: ה-Secrets מוגנים ולא נחשפים בלוגים
📅 **תזמון**: ה-cron מוגדר ב-UTC, אז 06:00 UTC = 08:00 ישראל
💾 **נתונים**: Firebase שומר את כל ההיסטוריה, data.js רק את ה-15 האחרונים
🔄 **עדכון**: אם אין כתבות חדשות, לא יתבצע commit

---

**תאריך הגדרה**: 17 בינואר 2026
**סטטוס**: ✅ מוכן לשימוש (לאחר הגדרת Secrets)
