package main

import (
    "database/sql"
    "net/http"
    "fmt"

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
    stmt, err := s.db.Prepare("SELECT * FROM sessions WHERE id=?");
    checkErr(err)

    rows, err := stmt.Query(id)
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
    stmt, err := s.db.Prepare("SELECT * FROM sessions");
    checkErr(err)

    rows, err := stmt.Query()
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
    stmt, err := s.db.Prepare("INSERT INTO sessions DEFAULT VALUES")
    checkErr(err)

    res, err := stmt.Exec()
    checkErr(err)

    id, err := res.LastInsertId()
    checkErr(err)

    return s.GetSession(id)
}

func (s *Store) GetHit(id int64) (*hit, bool) {
    stmt, err := s.db.Prepare("SELECT id, x, y, angle, dist, score FROM hit WHERE id=?")

    rows, err := stmt.Query(id)
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

func (s *Store) CreateHit(h hit, session_id int64) (*hit, bool) {
    stmt, err := s.db.Prepare("INSERT INTO hits(session, x,y,angle,dist,score) VALUES (?,?,?,?,?)")
    checkErr(err)

    res, err := stmt.Exec(session_id, h.X, h.Y, h.Angle, h.Dist, h.Score)
    checkErr(err)

    id, err := res.LastInsertId()
    checkErr(err)

    return s.GetHit(id)
}

func (s *Store) DeleteHit(h hit) (bool) {
    stmt, err := s.db.Prepare("DELETE FROM hits WHERE id=?")
    checkErr(err)

    _, err = stmt.Exec(h.Id) // TODO Handle res?
    checkErr(err)

    return true
}

func (s *Store) UpdateHit(h hit) (*hit, bool) {
    stmt, err := s.db.Prepare("UPDATE hits SET x=?,y=?,angle=?,dist=?,score=? WHERE id=?")
    checkErr(err)

    _, err = stmt.Exec(h.X, h.Y, h.Angle, h.Dist, h.Score, h.Id) // TODO Handle res?
    checkErr(err)

    return s.GetHit(h.Id)
}



type SessionBinding struct {
    Session *int64 `uri:"session" binding:"required"`
}

func getSession(c *gin.Context) {
    var binding SessionBinding
    if err := c.ShouldBindUri(&binding); err != nil {
        fmt.Println("Error we got was: " + err.Error())
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

func main() {
    store = NewStore()

    router := gin.Default()

    router.GET("/api/sessions", getAllSessions)
    router.GET("/api/sessions/:session", getSession)
    router.POST("/api/sessions", createSession)

    //router.GET("/api/hits", getHits)
    //router.POST("/api/hits", addHit)

    //router.GET("/api/sessions", getSessions)
    //router.GET("/api/sessions/:session", getSession)
    //router.POST("/api/sessions", createSession)
    // https://gin-gonic.com/docs/examples/bind-uri/
    // router.GET"("/api/hits/:hit", getHit)

    // I guess the URI structure should be /api/sessions/:session/hits/:hit
    // POST /api/sessions   - create session
    // GET  /api/sessions   - get all sessions
    // GET  /api/essions/1  - get first session
    // POST /api/sessions/1/hits   - create hit
    // GET  /api/sessions/1/hits   - get all hits for session
    // GET  /api/sessions/1/hits/1 - get first hit for session

    router.Run("0.0.0.0:8081")
}

func checkErr(err error) {
    if err != nil {
        panic(err)
    }
}
