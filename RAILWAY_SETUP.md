# Railway.app - הגדרת עדכון אוטומטי יומי

## למה Railway?

Railway.app פותר את בעיית החסימה של Reddit ב-GitHub Actions:
- ✅ לא חסום על ידי Reddit
- ✅ $5 חינם לחודש (מספיק ל-2-3 חודשים)
- ✅ Cron Jobs מובנה
- ✅ דפלוי אוטומטי מ-GitHub
- ✅ לא צריך לשנות קוד

---

## שלבי הגדרה

### שלב 1: הרשמה ל-Railway

1. לך ל: https://railway.app/
2. לחץ **"Start a New Project"**
3. התחבר עם **GitHub** (OAuth)
4. אשר את ההרשאות

---

### שלב 2: יצירת פרויקט חדש

1. בדף הראשי של Railway, לחץ **"New Project"**
2. בחר **"Deploy from GitHub repo"**
3. בחר את הrepository: **Tomza78/SCRAPER**
4. Railway יתחיל לבנות את הפרויקט אוטומטית

---

### שלב 3: הגדרת Environment Variables

ב-Railway Dashboard:

1. לחץ על הפרויקט שלך
2. לך ל-**"Variables"** (בתפריט הצד)
3. לחץ **"New Variable"** והוסף:

```
GOOGLE_API_KEY=***REDACTED***
```

```
APIFY_TOKEN=***REDACTED***
```

```
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

4. ל-Firebase credentials, צריך להוסיף את כל ה-JSON:

לחץ **"New Variable"**, שם: `FIREBASE_CREDENTIALS`

ערך: (העתק את כל התוכן של serviceAccountKey.json):
```json
{
  "type": "service_account",
  "project_id": "scrapper-293aa",
  ...
}
```

---

### שלב 4: הגדרת Cron Job

Railway לא תומך ב-built-in cron נכון לעכשיו, אז יש 2 אפשרויות:

#### אפשרות A: Cron-job.org (חינמי, מומלץ!)

1. לך ל: https://cron-job.org/en/
2. הירשם (חינמי)
3. צור Job חדש:
   - **Title**: Reddit Scraper Daily
   - **URL**: `https://[YOUR-RAILWAY-URL]/api/run-job`
   - **Schedule**: `0 6 * * *` (8:00 AM Israel time)
   - **Request Method**: POST
4. לחץ **Create**

📝 **איפה למצוא את ה-Railway URL?**
- בדף הפרויקט ב-Railway
- לחץ על **"Settings"** → **"Domains"**
- תראה URL כמו: `scraper-production-xyz.up.railway.app`

#### אפשרות B: EasyCron (חינמי, אלטרנטיבה)

1. לך ל: https://www.easycron.com/
2. הירשם (חינמי - 100 executions/חודש)
3. צור Cron Job חדש
4. הגדר את אותם פרטים כמו למעלה

---

### שלב 5: שנה את הקוד להפעיל server (במקום standalone)

כדי ש-cron-job.org יוכל לקרוא ל-API endpoint, צריך להריץ server במקום standalone script.

ב-Railway:
1. לך ל-**Settings** → **Deploy**
2. שנה את **Start Command** ל:
```
npm start
```

זה יריץ את `src/server.js` שכבר יש לו את ה-endpoint `/api/run-job`

---

## איך לבדוק שזה עובד?

### בדיקה ידנית:

1. לך ל-Railway Dashboard
2. לחץ על **"Deployments"**
3. ודא שה-deployment הצליח (סימן ✓ ירוק)
4. לחץ על **"View Logs"** - תראה את הלוגים
5. בדוק שהserver רץ: `Server running at http://localhost:3000`

### בדיקת API:

פתח דפדפן ונסה:
```
https://[YOUR-RAILWAY-URL]/api/run-job
```

(שנה POST ל-GET זמנית לבדיקה, או השתמש ב-Postman)

---

## עלויות

- **$5 חינמיים/חודש** (מספיק ל-2-3 חודשים של שימוש קל)
- אחרי זה: ~$1-3/חודש (תלוי בשימוש)
- cron-job.org: **חינמי לחלוטין**

---

## פתרון בעיות

### הפרויקט לא עולה?
- בדוק את הלוגים ב-Railway Dashboard
- ודא שכל ה-Environment Variables הוגדרו
- ודא ש-`npm start` מוגדר כ-Start Command

### הserver לא מגיב?
- בדוק שה-PORT נכון (Railway מגדיר PORT אוטומטית)
- ודא שה-deployment הצליח

### Cron לא רץ?
- ודא שה-URL ב-cron-job.org נכון
- בדוק שה-endpoint `/api/run-job` עובד ידנית
- בדוק את הלוגים של cron-job.org

---

## סיכום מהיר

1. ✅ הרשם ל-Railway.app
2. ✅ Deploy מ-GitHub
3. ✅ הוסף Environment Variables
4. ✅ שנה Start Command ל-`npm start`
5. ✅ הגדר Cron ב-cron-job.org
6. ✅ תהנה מעדכונים אוטומטיים יומיים!

---

**תאריך הגדרה**: 17 בינואר 2026
**סטטוס**: ✅ מוכן לדפלוי
