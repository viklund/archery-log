package main

import (
    "database/sql"
    "net/http"

    "github.com/gin-gonic/gin"
    _ "github.com/mattn/go-sqlite3"
)

// Structures
type hit struct {
    Id    int64   `json:"id"`
    X     float64 `json:"X"`
    Y     float64 `json:"Y"`
    Angle float64 `json:"Angle"`
    Dist  float64 `json:"Dist"`
    Score int32   `json:"Score"`
}

type session struct {
    Id        int64  `json:"id"`
    Starttime string `json:"starttime"`
    Open      bool   `json:"open"`
}


// Store
type Store struct {
    db *sql.DB
}
var store *Store

func NewStore() *Store {
    db, err := sql.Open("sqlite3", "./database.db")
    if err != nil {
        panic("Can't connect to database: " + err.Error())
    }
    return &Store{db:db}
}

func (s *Store) GetSession(id int64) (*session, bool) {
    rows, err := s.db.Query("SELECT * FROM sessions WHERE id=?", id);
    checkErr(err)

    var sessions = []session{}

    for rows.Next() {
        var s session
        err = rows.Scan(&s.Id, &s.Starttime, &s.Open)
        checkErr(err)

        sessions = append(sessions, s)
    }

    if (len(sessions) == 1) {
        return &sessions[0], true
    }
    return nil, false
}

func (s *Store) GetAllSessions() ([]session, bool) {
    rows, err := s.db.Query("SELECT * FROM sessions");
    checkErr(err)

    var sessions = []session{}

    for rows.Next() {
        var s session
        err = rows.Scan(&s.Id, &s.Starttime, &s.Open)
        checkErr(err)

        sessions = append(sessions, s)
    }

    if (len(sessions) > 1) {
        return sessions, true
    }
    return nil, false
}

func (s *Store) CreateSession() (*session, bool) {
    res, err := s.db.Exec("INSERT INTO sessions DEFAULT VALUES")
    checkErr(err)

    id, err := res.LastInsertId()
    checkErr(err)

    return s.GetSession(id)
}


func (s *Store) GetHit(id int64) (*hit, bool) {
    rows, err := s.db.Query("SELECT id, x, y, angle, dist, score FROM hits WHERE id=?", id)
    checkErr(err)

    var hits = []hit{}

    for rows.Next() {
        var h hit
        err = rows.Scan(&h.Id, &h.X, &h.Y, &h.Angle, &h.Dist, &h.Score)
        checkErr(err)

        hits = append(hits, h)
    }

    if (len(hits) == 1) {
        return &hits[0], true
    }
    return nil, false
}

func (s *Store) GetSessionHits(session_id int64) ([]hit, bool) {
    rows, err := s.db.Query("SELECT id, x, y, angle, dist, score FROM hits WHERE session=?", session_id)
    checkErr(err)

    var hits = []hit{}

    for rows.Next() {
        var h hit
        err = rows.Scan(&h.Id, &h.X, &h.Y, &h.Angle, &h.Dist, &h.Score)
        checkErr(err)

        hits = append(hits, h)
    }

    if (len(hits) > 1) {
        return hits, true
    }
    return nil, false
}

func (s *Store) GetSessionHit(session_id int64, hit_id int64) ([]hit, bool) {
    rows, err := s.db.Query("SELECT id, x, y, angle, dist, score FROM hits WHERE session=? AND id=?", session_id, hit_id)
    checkErr(err)

    var hits = []hit{}

    for rows.Next() {
        var h hit
        err = rows.Scan(&h.Id, &h.X, &h.Y, &h.Angle, &h.Dist, &h.Score)
        checkErr(err)

        hits = append(hits, h)
    }

    if (len(hits) == 1) {
        return hits, true
    }
    return nil, false
}

func (s *Store) CreateHit(h hit, session_id int64) (*hit, bool) {
    res, err := s.db.Exec("INSERT INTO hits(session, x,y,angle,dist,score) VALUES (?,?,?,?,?,?)",
        session_id, h.X, h.Y, h.Angle, h.Dist, h.Score)
    checkErr(err)

    id, err := res.LastInsertId()
    checkErr(err)

    return s.GetHit(id)
}

func (s *Store) DeleteHit(h hit) (bool) {
    _, err := s.db.Exec("DELETE FROM hits WHERE id=?", h.Id) // TODO Handle res?
    checkErr(err)

    return true
}

func (s *Store) UpdateHit(h hit) (*hit, bool) {
    _, err := s.db.Exec("UPDATE hits SET x=?,y=?,angle=?,dist=?,score=? WHERE id=?",
        h.X, h.Y, h.Angle, h.Dist, h.Score, h.Id) // TODO Handle res?
    checkErr(err)

    return s.GetHit(h.Id)
}



type SessionBinding struct {
    Session *int64 `uri:"session" binding:"required"`
}

type SessionHitBinding struct {
    Session *int64 `uri:"session" binding:"required"`
    Hit     *int64 `uri:"hit"     binding:"required"`
}

func getSession(c *gin.Context) {
    var binding SessionBinding
    if err := c.ShouldBindUri(&binding); err != nil {
        c.IndentedJSON(400, gin.H{"msg": err})
        return
    }
    if s, ok := store.GetSession(*binding.Session); ok {
        c.IndentedJSON(http.StatusOK, s)
    } else {
        c.IndentedJSON(http.StatusNotFound, nil)
    }
}

func getAllSessions(c *gin.Context) {
    if s, ok := store.GetAllSessions(); ok {
        c.IndentedJSON(http.StatusOK, s)
    } else {
        c.IndentedJSON(http.StatusNotFound, nil)
    }
}

func createSession(c *gin.Context) {
    if session, ok := store.CreateSession(); ok {
        c.IndentedJSON(http.StatusCreated, session)
    } else {
        c.IndentedJSON(http.StatusInternalServerError, nil)
    }
}

func getSessionHits(c *gin.Context) {
    var binding SessionBinding
    if err := c.ShouldBindUri(&binding); err != nil {
        c.IndentedJSON(400, gin.H{"msg": err})
        return
    }
    if hs, ok := store.GetSessionHits(*binding.Session); ok {
        c.IndentedJSON(http.StatusOK, hs)
    } else {
        c.IndentedJSON(http.StatusNotFound, nil)
    }
}

func getSessionHit(c *gin.Context) {
    var binding SessionHitBinding
    if err := c.ShouldBindUri(&binding); err != nil {
        c.IndentedJSON(400, gin.H{"msg": err})
        return
    }
    if hs, ok := store.GetSessionHit(*binding.Session, *binding.Hit); ok {
        c.IndentedJSON(http.StatusOK, hs)
    } else {
        c.IndentedJSON(http.StatusNotFound, nil)
    }
}

type hitJSONBinding struct {
    X     float64 `json:"X"`
    Y     float64 `json:"Y"`
    Angle float64 `json:"Angle"`
    Dist  float64 `json:"Dist"`
    Score int32   `json:"Score"`
}

func createSessionHit(c *gin.Context) {
    var binding SessionBinding
    if err := c.ShouldBindUri(&binding); err != nil {
        c.IndentedJSON(400, gin.H{"msg": err})
        return
    }
    var hitBinding hitJSONBinding
    c.Bind(&hitBinding)
    h := hit{
        X:     hitBinding.X,
        Y:     hitBinding.Y,
        Angle: hitBinding.Angle,
        Dist:  hitBinding.Dist,
        Score: hitBinding.Score,
    }
    if hs, ok := store.CreateHit(h, *binding.Session); ok {
        c.IndentedJSON(http.StatusOK, hs)
    } else {
        c.IndentedJSON(http.StatusNotFound, nil)
    }
}


func main() {
    store = NewStore()

    router := gin.Default()

    // https://gin-gonic.com/docs/examples/bind-uri/
    router.GET("/api/sessions", getAllSessions)
    router.GET("/api/sessions/:session", getSession)
    router.POST("/api/sessions", createSession)

    router.GET("/api/sessions/:session/hits", getSessionHits)
    router.GET("/api/sessions/:session/hits/:hit", getSessionHit)
    router.POST("/api/sessions/:session/hits", createSessionHit)

    router.Run("0.0.0.0:8081")
}

func checkErr(err error) {
    if err != nil {
        panic(err)
    }
}
