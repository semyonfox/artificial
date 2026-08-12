pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps {
        script {
          checkout([
            $class: 'GitSCM',
            branches: [[name: '*/main']],
            userRemoteConfigs: [[url: 'https://github.com/semyonfox/artificial.git']]
          ])
          // Preserve the commit that the verification stages actually tested.
          env.VERIFIED_GIT_COMMIT = sh(
            script: 'git rev-parse HEAD',
            returnStdout: true
          ).trim()
        }
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'corepack enable'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Verify') {
      steps {
        sh 'pnpm run check'
      }
    }

    stage('Deploy') {
      steps {
        // deploy dir /home/semyon/artificial is bind-mounted into this
        // container at the same path, so docker compose paths resolve
        // identically inside and on the host.
        sh '''
          set -e
          cd /home/semyon/artificial
          # Jenkins runs as root but the deploy repo is owned by semyon —
          # whitelist it via -c so git stops refusing to operate.
          git -c safe.directory=/home/semyon/artificial/repo -C repo fetch origin main
          # Never replace the verified checkout with a newer origin/main. If
          # that exact commit is no longer available, fail rather than deploy
          # a different revision.
          git -c safe.directory=/home/semyon/artificial/repo -C repo cat-file -e "${VERIFIED_GIT_COMMIT}^{commit}"
          git -c safe.directory=/home/semyon/artificial/repo -C repo reset --hard "$VERIFIED_GIT_COMMIT"
          docker compose up -d --build web
        '''
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}
