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
        checkout([
          $class: 'GitSCM',
          branches: [[name: '*/main']],
          userRemoteConfigs: [[url: 'https://github.com/semyonfox/artificial.git']]
        ])
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'corepack enable'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Build') {
      steps {
        sh 'pnpm run build'
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
          git -C repo fetch origin main
          git -C repo reset --hard origin/main
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
